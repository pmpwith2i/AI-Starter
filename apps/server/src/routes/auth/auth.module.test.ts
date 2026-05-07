import { describe, it, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";
import {
  errorHandlerPlugin,
  HttpErrorResponse,
} from "../../plugins/error-handler.plugin.js";

// ─── Service mocks ─────────────────────────────────────────────────────────────
//
// The auth route schemas declare the full set of required response fields
// (`userId`, `role`, `firstName`, `lastName`, `onboardingCompleted`,
// `accessToken`, `refreshToken`). Fastify validates the response shape on
// serialization, so the service mocks must return all of them or the
// `200`/`201` reply throws.

const buildAuthSuccess = (
  userId: string,
  overrides: Record<string, unknown> = {},
) => ({
  userId,
  role: "patient",
  firstName: null,
  lastName: null,
  email: "user@example.com",
  emailVerified: false,
  onboardingCompleted: false,
  accessToken: "access.token.sig",
  refreshToken: "refresh-uuid",
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockLoginUser = mock.fn(async (_email: string, _password: string) =>
  buildAuthSuccess("user-123"),
);

const mockRegisterUser = mock.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_email: string, _password: string, _fn: string, _ln: string) =>
    buildAuthSuccess("user-456"),
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockRefreshAccessToken = mock.fn(async (_refreshToken: string) => ({
  accessToken: "new-access.token.sig",
  refreshToken: "new-refresh-uuid",
  role: "patient",
}));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockLogoutUser = mock.fn(async (_refreshToken: string) => {});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockVerifyEmail = mock.fn(async (_userId: string, _code: string) => ({
  verified: true,
}));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockResendVerificationCode = mock.fn(async (_userId: string) => ({
  sent: true,
  message: "Nuovo codice inviato alla tua email.",
}));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockForgotPassword = mock.fn(async (_email: string) => {});
const mockResetPassword = mock.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_email: string, _code: string, _newPassword: string) => {},
);

mock.module("./auth.service.js", {
  namedExports: {
    loginUser: mockLoginUser,
    registerUser: mockRegisterUser,
    refreshAccessToken: mockRefreshAccessToken,
    logoutUser: mockLogoutUser,
    verifyEmail: mockVerifyEmail,
    resendVerificationCode: mockResendVerificationCode,
    forgotPassword: mockForgotPassword,
    resetPassword: mockResetPassword,
  },
});

// ─── Import module under test (after mocks) ───────────────────────────────────

const { default: authModule } = await import("./auth.module.js");

// ─── Test app factory ─────────────────────────────────────────────────────────

const buildTestApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: false });
  await app.register(errorHandlerPlugin);

  // Minimal authenticate decorator for testing authenticated endpoints
  app.decorate(
    "authenticate",
    async (request: { user: { id: string } | null }) => {
      request.user = { id: "user-test" };
    },
  );

  await app.register(authModule, { prefix: "/auth" });
  await app.ready();
  return app;
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildTestApp();
  });

  after(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockLoginUser.mock.resetCalls();
    mockLoginUser.mock.mockImplementation(async () =>
      buildAuthSuccess("user-123"),
    );
  });

  it("returns 400 when email is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { password: "secret" },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com" },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when email format is invalid", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "not-an-email", password: "secret" },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 401 with error code when service throws INVALID_CREDENTIALS", async () => {
    mockLoginUser.mock.mockImplementation(async () => {
      throw new HttpErrorResponse(
        "Email or password is invalid",
        401,
        "INVALID_CREDENTIALS",
      );
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: "wrong" },
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload) as {
      message: string;
      code: string;
    };
    assert.equal(body.message, "Email or password is invalid");
    assert.equal(body.code, "INVALID_CREDENTIALS");
  });

  it("returns 200 with userId, accessToken, and refreshToken on success", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: "correct" },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload) as {
      userId: string;
      accessToken: string;
      refreshToken: string;
    };
    assert.equal(body.userId, "user-123");
    assert.equal(body.accessToken, "access.token.sig");
    assert.equal(body.refreshToken, "refresh-uuid");
  });

  it("forwards email and password to the service unchanged", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: "my-pass" },
    });

    assert.equal(mockLoginUser.mock.callCount(), 1);
    const [email, password] = mockLoginUser.mock.calls[0].arguments as [
      string,
      string,
    ];
    assert.equal(email, "user@example.com");
    assert.equal(password, "my-pass");
  });

  it("returns 500 when service throws an unhandled error", async () => {
    mockLoginUser.mock.mockImplementation(async () => {
      throw new Error("unexpected database failure");
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user@example.com", password: "pass" },
    });

    assert.equal(res.statusCode, 500);
    const body = JSON.parse(res.payload) as { status: string; message: string };
    assert.equal(body.status, "error");
    assert.equal(
      body.message,
      "An unexpected error occurred. Please try again later.",
    );
  });
});

// ─── POST /auth/signup ────────────────────────────────────────────────────────

describe("POST /auth/signup", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildTestApp();
  });

  after(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockRegisterUser.mock.resetCalls();
    mockRegisterUser.mock.mockImplementation(async () =>
      buildAuthSuccess("user-456"),
    );
  });

  it("returns 400 when email is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { password: "Password1", firstName: "Test", lastName: "User" },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        firstName: "Test",
        lastName: "User",
      },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when email format is invalid", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "not-an-email",
        password: "Password1",
        firstName: "Test",
        lastName: "User",
      },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when password is shorter than 6 characters", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        password: "P1a",
        firstName: "Test",
        lastName: "User",
      },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when password has no uppercase letter", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        password: "password1",
        firstName: "Test",
        lastName: "User",
      },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 400 when password has no digit", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        password: "Password",
        firstName: "Test",
        lastName: "User",
      },
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 409 with error code when service throws EMAIL_TAKEN", async () => {
    mockRegisterUser.mock.mockImplementation(async () => {
      throw new HttpErrorResponse(
        "An account with this email already exists",
        409,
        "EMAIL_TAKEN",
      );
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "existing@example.com",
        password: "Password1",
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
      },
    });

    assert.equal(res.statusCode, 409);
    const body = JSON.parse(res.payload) as { code: string };
    assert.equal(body.code, "EMAIL_TAKEN");
  });

  it("returns 201 with userId, accessToken, and refreshToken on success", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        password: "Password1",
        firstName: "Test",
        lastName: "User",
        termsAccepted: true,
      },
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload) as {
      userId: string;
      accessToken: string;
      refreshToken: string;
    };
    assert.equal(body.userId, "user-456");
    assert.ok(body.accessToken.length > 0);
    assert.ok(body.refreshToken.length > 0);
  });

  it("forwards all fields to the service unchanged", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        password: "Password1",
        firstName: "Mario",
        lastName: "Rossi",
        termsAccepted: true,
      },
    });

    assert.equal(mockRegisterUser.mock.callCount(), 1);
    const [email, password, firstName, lastName] = mockRegisterUser.mock
      .calls[0].arguments as [string, string, string, string];
    assert.equal(email, "new@example.com");
    assert.equal(password, "Password1");
    assert.equal(firstName, "Mario");
    assert.equal(lastName, "Rossi");
  });

  it("returns 400 when termsAccepted is missing or false", async () => {
    const missing = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        password: "Password1",
        firstName: "Test",
        lastName: "User",
      },
    });
    assert.equal(missing.statusCode, 400);

    const declined = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: {
        email: "new@example.com",
        password: "Password1",
        firstName: "Test",
        lastName: "User",
        termsAccepted: false,
      },
    });
    assert.equal(declined.statusCode, 400);
  });
});

// ─── POST /auth/refresh ──────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildTestApp();
  });

  after(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockRefreshAccessToken.mock.resetCalls();
    mockRefreshAccessToken.mock.mockImplementation(async () => ({
      accessToken: "new-access.token.sig",
      refreshToken: "new-refresh-uuid",
      role: "patient",
    }));
  });

  it("returns 400 when refreshToken is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: {},
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 200 with new token pair on success", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: "old-token" },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload) as {
      accessToken: string;
      refreshToken: string;
    };
    assert.equal(body.accessToken, "new-access.token.sig");
    assert.equal(body.refreshToken, "new-refresh-uuid");
  });

  it("returns 401 when service throws INVALID_REFRESH_TOKEN", async () => {
    mockRefreshAccessToken.mock.mockImplementation(async () => {
      throw new HttpErrorResponse(
        "Invalid or expired refresh token",
        401,
        "INVALID_REFRESH_TOKEN",
      );
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken: "bad-token" },
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload) as { code: string };
    assert.equal(body.code, "INVALID_REFRESH_TOKEN");
  });
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildTestApp();
  });

  after(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockLogoutUser.mock.resetCalls();
    mockLogoutUser.mock.mockImplementation(async () => {});
  });

  it("returns 400 when refreshToken is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: {},
    });

    assert.equal(res.statusCode, 400);
  });

  it("returns 200 with message on success", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: { refreshToken: "some-token" },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload) as { message: string };
    assert.equal(body.message, "Logged out");
  });

  it("calls logoutUser with the refresh token", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: { refreshToken: "token-to-invalidate" },
    });

    assert.equal(mockLogoutUser.mock.callCount(), 1);
    const [token] = mockLogoutUser.mock.calls[0].arguments as [string];
    assert.equal(token, "token-to-invalidate");
  });
});

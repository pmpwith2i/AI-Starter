import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import {
  ActivitySquare,
  Apple,
  Check,
  ChevronRight,
  HeartPulse,
  LogOut,
  Pencil,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppBackdrop,
  Display,
  GlassTabBar,
  LiquidGlassSurface,
  MOBILE_COLORS,
  MotionPressable,
  PageHeader,
  SectionHeader,
  Tile,
} from "../../components/ui/mobile-chrome";
import { clinicalProfileKeys } from "../../hooks/clinical-profile/clinical-profile.keys";
import { useClinicalProfile } from "../../hooks/clinical-profile/use-clinical-profile";
import { sdk } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/auth-context";

const PROFILE_QUERY_KEY = ["profile", "me"] as const;

type ProfileResponse = Awaited<ReturnType<typeof sdk.profile.get>>;
type ClinicalProfile = NonNullable<ReturnType<typeof useClinicalProfile>["data"]>;
type ClinicalProfileInput = Parameters<typeof sdk.clinicalProfile.upsert>[0];

type ClinicalDraft = {
  sex: string | null;
  clinicalStatus: string | null;
  age: string;
  height: string;
  weight: string;
  activityLevel: string | null;
  dietPreference: string | null;
  breakfastPreference: string | null;
  goals: string[];
  allergies: string;
  conditions: string;
  dietaryRestrictions: string;
  dislikes: string;
  bloodType: string;
};

type ProfileOption = {
  value: string;
  label: string;
  description?: string;
};

const SEX_OPTIONS: ProfileOption[] = [
  { value: "f", label: "Donna" },
  { value: "m", label: "Uomo" },
  { value: "other", label: "Altro" },
];

const CLINICAL_STATUS_OPTIONS: ProfileOption[] = [
  {
    value: "in_treatment",
    label: "In trattamento",
    description: "Terapie o cure attive",
  },
  {
    value: "follow_up",
    label: "Follow-up",
    description: "Controlli periodici",
  },
  {
    value: "remission",
    label: "Remissione",
    description: "Monitoraggio leggero",
  },
  {
    value: "prevention",
    label: "Prevenzione",
    description: "Benessere e familiarita",
  },
  {
    value: "prefer_not_to_say",
    label: "Preferisco non dirlo",
    description: "Mantieni privata questa informazione",
  },
];

const ACTIVITY_OPTIONS: ProfileOption[] = [
  { value: "sedentary", label: "Sedentaria", description: "Poco movimento" },
  { value: "light", label: "Leggera", description: "Camminate quotidiane" },
  { value: "moderate", label: "Moderata", description: "Sport 2-3 volte/settimana" },
  { value: "active", label: "Attiva", description: "Allenamenti frequenti" },
  { value: "very_active", label: "Molto attiva", description: "Sport intenso o lavoro fisico" },
];

const DIET_OPTIONS: ProfileOption[] = [
  { value: "omnivore", label: "Onnivora" },
  { value: "pescetarian", label: "Pescetariana" },
  { value: "vegetarian", label: "Vegetariana" },
  { value: "vegan", label: "Vegana" },
];

const BREAKFAST_OPTIONS: ProfileOption[] = [
  { value: "sweet", label: "Dolce" },
  { value: "savory", label: "Salata" },
];

const GOAL_OPTIONS: ProfileOption[] = [
  { value: "nutrition", label: "Nutrizione" },
  { value: "specialists", label: "Specialisti" },
  { value: "courses", label: "Corsi" },
  { value: "tracking", label: "Monitoraggio" },
  { value: "community", label: "Community" },
];

const SEX_LABEL = Object.fromEntries(
  SEX_OPTIONS.map((option) => [option.value, option.label]),
);
const CLINICAL_STATUS_LABEL = Object.fromEntries(
  CLINICAL_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);
const ACTIVITY_LABEL = Object.fromEntries(
  ACTIVITY_OPTIONS.map((option) => [option.value, option.label]),
);
const DIET_LABEL = Object.fromEntries(
  DIET_OPTIONS.map((option) => [option.value, option.label]),
);
const BREAKFAST_LABEL = Object.fromEntries(
  BREAKFAST_OPTIONS.map((option) => [option.value, option.label]),
);
const GOAL_LABEL = Object.fromEntries(
  GOAL_OPTIONS.map((option) => [option.value, option.label]),
);

const DATE_FORMAT = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function display(value: string | number | null | undefined, fallback = "Non indicato") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function labelFrom(
  map: Record<string, string>,
  value: string | null | undefined,
  fallback = "Non indicato",
) {
  if (!value) return fallback;
  return map[value] ?? value;
}

function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanString(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseOptionalNumber(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (normalized.length === 0) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "Mai aggiornato";
  return DATE_FORMAT.format(new Date(value));
}

function createClinicalDraft(profile: ClinicalProfile | undefined): ClinicalDraft {
  return {
    sex: profile?.sex ?? null,
    clinicalStatus: profile?.clinicalStatus ?? null,
    age: profile?.age ? String(profile.age) : "",
    height: profile?.height ? String(profile.height) : "",
    weight: profile?.weight ? String(profile.weight) : "",
    activityLevel: profile?.activityLevel ?? null,
    dietPreference: profile?.dietPreference ?? null,
    breakfastPreference: profile?.breakfastPreference ?? null,
    goals: profile?.goals ?? [],
    allergies: profile?.allergies ?? "",
    conditions: profile?.conditions ?? "",
    dietaryRestrictions: profile?.dietaryRestrictions ?? "",
    dislikes: profile?.dislikes ?? "",
    bloodType: profile?.bloodType ?? "",
  };
}

function clinicalDraftToInput(draft: ClinicalDraft): ClinicalProfileInput {
  const diet = draft.dietPreference;
  return {
    sex: draft.sex,
    clinicalStatus: draft.clinicalStatus,
    age: parseOptionalNumber(draft.age),
    height: parseOptionalNumber(draft.height),
    weight: parseOptionalNumber(draft.weight),
    activityLevel: draft.activityLevel,
    dietPreference: diet,
    breakfastPreference: draft.breakfastPreference,
    goals: draft.goals.length > 0 ? draft.goals : null,
    allergies: cleanString(draft.allergies),
    conditions: cleanString(draft.conditions),
    dietaryRestrictions: cleanString(draft.dietaryRestrictions),
    dislikes: cleanString(draft.dislikes),
    bloodType: cleanString(draft.bloodType),
    isVegan: diet ? diet === "vegan" : null,
    isVegetarian: diet ? diet === "vegetarian" || diet === "vegan" : null,
  };
}

function hasInvalidNumbers(draft: ClinicalDraft): boolean {
  const age = parseOptionalNumber(draft.age);
  const height = parseOptionalNumber(draft.height);
  const weight = parseOptionalNumber(draft.weight);

  if (draft.age.trim() && (age === null || age < 0 || age > 130)) return true;
  if (draft.height.trim() && (height === null || height <= 0)) return true;
  if (draft.weight.trim() && (weight === null || weight <= 0)) return true;
  return false;
}

function profileCompleteness(profile: ClinicalProfile | undefined): number {
  if (!profile) return 0;
  const fields = [
    profile.sex,
    profile.age,
    profile.height,
    profile.weight,
    profile.activityLevel,
    profile.dietPreference,
    profile.breakfastPreference,
    profile.clinicalStatus,
    profile.goals?.length ? profile.goals.join(",") : null,
  ];
  const filled = fields.filter(
    (value) => value !== null && value !== undefined && value !== "",
  ).length;
  return Math.round((filled / fields.length) * 100);
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { user, logout, refreshProfile } = useAuth();
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingClinical, setEditingClinical] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [clinicalDraft, setClinicalDraft] = useState<ClinicalDraft>(() =>
    createClinicalDraft(undefined),
  );

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => sdk.profile.get(),
    staleTime: 5 * 60_000,
  });
  const clinicalQuery = useClinicalProfile();

  const profile = profileQuery.data;
  const clinicalProfile = clinicalQuery.data;
  const fullName = [
    profile?.firstName ?? user?.firstName,
    profile?.lastName ?? user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const completion = profileCompleteness(clinicalProfile);
  const invalidClinicalDraft = hasInvalidNumbers(clinicalDraft);

  useEffect(() => {
    if (editingAccount) return;
    setFirstName(profile?.firstName ?? user?.firstName ?? "");
    setLastName(profile?.lastName ?? user?.lastName ?? "");
  }, [
    editingAccount,
    profile?.firstName,
    profile?.lastName,
    user?.firstName,
    user?.lastName,
  ]);

  useEffect(() => {
    if (!editingClinical) {
      setClinicalDraft(createClinicalDraft(clinicalProfile));
    }
  }, [clinicalProfile, editingClinical]);

  const accountMutation = useMutation({
    mutationFn: () =>
      sdk.profile.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData<ProfileResponse>(PROFILE_QUERY_KEY, updated);
      await refreshProfile();
      setEditingAccount(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const clinicalMutation = useMutation({
    mutationFn: () => sdk.clinicalProfile.upsert(clinicalDraftToInput(clinicalDraft)),
    onSuccess: (updated) => {
      queryClient.setQueryData(clinicalProfileKeys.me(), updated);
      setEditingClinical(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const isRefreshing = profileQuery.isRefetching || clinicalQuery.isRefetching;

  const refresh = () => {
    void profileQuery.refetch();
    void clinicalQuery.refetch();
  };

  const goals = useMemo(
    () => clinicalProfile?.goals?.map((goal) => GOAL_LABEL[goal] ?? goal) ?? [],
    [clinicalProfile?.goals],
  );

  const allergies = splitList(clinicalProfile?.allergies);
  const restrictions = splitList(clinicalProfile?.dietaryRestrictions);
  const dislikes = splitList(clinicalProfile?.dislikes);
  const canSaveClinical = !invalidClinicalDraft && !clinicalMutation.isPending;

  return (
    <AppBackdrop>
      <StatusBar style="light" />

      <SafeAreaView edges={["top"]} className="px-5 pt-2">
        <PageHeader
          eyebrow="Profilo"
          title={fullName || "Il tuo profilo"}
          subtitle="Gestisci i dati personali e sanitari che guidano nutrizione, corsi ed esperienza in app."
        />
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-36 pt-7"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="rgba(247,251,255,0.72)"
          />
        }
      >
        <AccountCard
          profile={profile}
          email={user?.email ?? profile?.email ?? ""}
          firstName={firstName}
          lastName={lastName}
          editing={editingAccount}
          saving={accountMutation.isPending}
          error={accountMutation.isError}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onEdit={() => {
            setFirstName(profile?.firstName ?? user?.firstName ?? "");
            setLastName(profile?.lastName ?? user?.lastName ?? "");
            setEditingAccount(true);
            void Haptics.selectionAsync();
          }}
          onCancel={() => {
            setEditingAccount(false);
            setFirstName(profile?.firstName ?? user?.firstName ?? "");
            setLastName(profile?.lastName ?? user?.lastName ?? "");
          }}
          onSave={() => accountMutation.mutate()}
        />

        <View className="mt-8">
          <SectionHeader
            icon={ShieldCheck}
            label="Profilo sanitario"
            action={
              clinicalProfile && !editingClinical ? (
                <MotionPressable
                  onPress={() => {
                    setClinicalDraft(createClinicalDraft(clinicalProfile));
                    setEditingClinical(true);
                    void Haptics.selectionAsync();
                  }}
                  className="rounded-full bg-[#f7fbff]/10 px-3 py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Modifica profilo sanitario"
                >
                  <Text className="text-xs font-semibold text-[#f7fbff]/70">
                    Modifica
                  </Text>
                </MotionPressable>
              ) : null
            }
          />
          {clinicalQuery.isPending ? (
            <LoadingCard />
          ) : editingClinical ? (
            <ClinicalEditor
              draft={clinicalDraft}
              saving={clinicalMutation.isPending}
              invalidNumbers={invalidClinicalDraft}
              error={clinicalMutation.isError}
              onChange={setClinicalDraft}
              onCancel={() => {
                setClinicalDraft(createClinicalDraft(clinicalProfile));
                setEditingClinical(false);
              }}
              onSave={() => {
                if (!canSaveClinical) return;
                clinicalMutation.mutate();
              }}
            />
          ) : clinicalProfile ? (
            <ClinicalOverview
              profile={clinicalProfile}
              completion={completion}
              goals={goals}
              allergies={allergies}
              restrictions={restrictions}
              dislikes={dislikes}
              onEdit={() => {
                setClinicalDraft(createClinicalDraft(clinicalProfile));
                setEditingClinical(true);
                void Haptics.selectionAsync();
              }}
            />
          ) : (
            <MissingClinicalProfile
              onCreate={() => {
                setClinicalDraft(createClinicalDraft(undefined));
                setEditingClinical(true);
                void Haptics.selectionAsync();
              }}
            />
          )}
        </View>

        <View className="mt-8">
          <SectionHeader icon={Sparkles} label="Azioni" />
          <View className="gap-3">
            <ActionRow
              icon={RefreshCw}
              title="Aggiorna dati sanitari"
              subtitle="Rivedi misure, preferenze e obiettivi in qualsiasi momento."
              onPress={() => {
                setClinicalDraft(createClinicalDraft(clinicalProfile));
                setEditingClinical(true);
                void Haptics.selectionAsync();
              }}
            />
            <ActionRow
              icon={LogOut}
              title="Esci"
              subtitle="Disconnetti questo dispositivo."
              danger
              onPress={() => void logout()}
            />
          </View>
        </View>
      </ScrollView>

      <GlassTabBar />
    </AppBackdrop>
  );
}

function AccountCard({
  profile,
  email,
  firstName,
  lastName,
  editing,
  saving,
  error,
  onFirstNameChange,
  onLastNameChange,
  onEdit,
  onCancel,
  onSave,
}: {
  profile: ProfileResponse | undefined;
  email: string;
  firstName: string;
  lastName: string;
  editing: boolean;
  saving: boolean;
  error: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <LiquidGlassSurface tone="strong" radius={30} className="p-5">
      <View className="flex-row items-start gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-[#7c95ff]/18">
          <UserRound size={28} color={MOBILE_COLORS.primarySoft} strokeWidth={2.1} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[2.4px] text-[#f7fbff]/50">
            Account
          </Text>
          <Text className="mt-1 text-2xl font-bold leading-8 text-[#f7fbff]">
            {display(
              [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
              "Paziente oncologo.it",
            )}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-[#f7fbff]/60" numberOfLines={1}>
            {email}
          </Text>
        </View>
        {!editing ? (
          <MotionPressable
            onPress={onEdit}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-[#f7fbff]/10"
            accessibilityRole="button"
            accessibilityLabel="Modifica dati account"
          >
            <Pencil size={18} color="rgba(247,251,255,0.78)" strokeWidth={2.2} />
          </MotionPressable>
        ) : null}
      </View>

      {editing ? (
        <View className="mt-5 gap-3">
          <ProfileInput
            label="Nome"
            value={firstName}
            onChangeText={onFirstNameChange}
            placeholder="Nome"
          />
          <ProfileInput
            label="Cognome"
            value={lastName}
            onChangeText={onLastNameChange}
            placeholder="Cognome"
          />
          {error ? (
            <Text className="text-xs text-[#ec8f64]">
              Non sono riuscito a salvare. Riprova tra poco.
            </Text>
          ) : null}
          <EditorActions
            saving={saving}
            disabled={saving}
            onCancel={onCancel}
            onSave={onSave}
          />
        </View>
      ) : null}
    </LiquidGlassSurface>
  );
}

function ClinicalOverview({
  profile,
  completion,
  goals,
  allergies,
  restrictions,
  dislikes,
  onEdit,
}: {
  profile: ClinicalProfile;
  completion: number;
  goals: string[];
  allergies: string[];
  restrictions: string[];
  dislikes: string[];
  onEdit: () => void;
}) {
  return (
    <View className="gap-4">
      <LiquidGlassSurface tone="strong" radius={30} className="p-5">
        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-semibold uppercase tracking-[2.4px] text-[#f7fbff]/50">
              Profilo di cura
            </Text>
            <Text className="mt-2 text-4xl font-bold tracking-tight text-[#f7fbff]">
              {completion}%
            </Text>
            <Text className="mt-2 text-sm leading-6 text-[#f7fbff]/60">
              Ultimo aggiornamento: {formatUpdatedAt(profile.updatedAt)}
            </Text>
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#7ddac2]/16">
            <Check size={25} color={MOBILE_COLORS.nutrition} strokeWidth={2.4} />
          </View>
        </View>
        <View className="mt-5 h-2 overflow-hidden rounded-full bg-[#f7fbff]/10">
          <View
            className="h-2 rounded-full bg-[#7c95ff]"
            style={{ width: `${completion}%` }}
          />
        </View>
        <Text className="mt-4 text-xs leading-5 text-[#f7fbff]/50">
          Questi dati alimentano raccomandazioni, piano nutrizionale e contenuti
          suggeriti. Puoi modificarli in qualsiasi momento.
        </Text>
      </LiquidGlassSurface>

      <View className="flex-row gap-3">
        <MetricTile label="età" value={profile.age ? `${profile.age}` : "n.d."} />
        <MetricTile label="altezza" value={profile.height ? `${profile.height} cm` : "n.d."} />
        <MetricTile label="peso" value={profile.weight ? `${profile.weight} kg` : "n.d."} />
      </View>

      <LiquidGlassSurface radius={28} className="p-5">
        <SectionTitle icon={HeartPulse} label="Contesto clinico" />
        <View className="mt-4 gap-3">
          <InfoPair label="Sesso" value={labelFrom(SEX_LABEL, profile.sex)} />
          <InfoPair
            label="Stato clinico"
            value={labelFrom(CLINICAL_STATUS_LABEL, profile.clinicalStatus)}
          />
          <InfoPair
            label="Attività"
            value={labelFrom(ACTIVITY_LABEL, profile.activityLevel)}
          />
          <InfoPair label="Condizioni" value={display(profile.conditions)} />
        </View>
      </LiquidGlassSurface>

      <LiquidGlassSurface radius={28} className="p-5">
        <SectionTitle icon={Apple} label="Preferenze nutrizionali" />
        <View className="mt-4 gap-3">
          <InfoPair label="Dieta" value={labelFrom(DIET_LABEL, profile.dietPreference)} />
          <InfoPair
            label="Colazione"
            value={labelFrom(BREAKFAST_LABEL, profile.breakfastPreference)}
          />
          <ChipList label="Obiettivi" values={goals} empty="Non indicati" />
          <ChipList label="Allergie" values={allergies} empty="Nessuna indicata" />
          <ChipList label="Restrizioni" values={restrictions} empty="Nessuna indicata" />
          <ChipList label="Da evitare" values={dislikes} empty="Nessun alimento indicato" />
        </View>
      </LiquidGlassSurface>

      <MotionPressable
        onPress={onEdit}
        className="flex-row items-center justify-between rounded-3xl bg-[#7c95ff] px-5 py-4"
        accessibilityRole="button"
        accessibilityLabel="Modifica profilo sanitario"
      >
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-[#0d1424]">
            Modifica profilo sanitario
          </Text>
          <Text className="mt-0.5 text-xs font-medium text-[#0d1424]/60">
            Aggiorna dati clinici, misure e preferenze.
          </Text>
        </View>
        <ChevronRight size={18} color="#0d1424" strokeWidth={2.6} />
      </MotionPressable>
    </View>
  );
}

function ClinicalEditor({
  draft,
  saving,
  invalidNumbers,
  error,
  onChange,
  onCancel,
  onSave,
}: {
  draft: ClinicalDraft;
  saving: boolean;
  invalidNumbers: boolean;
  error: boolean;
  onChange: (next: ClinicalDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const update = <K extends keyof ClinicalDraft>(key: K, value: ClinicalDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  const toggleGoal = (value: string) => {
    const nextGoals = draft.goals.includes(value)
      ? draft.goals.filter((goal) => goal !== value)
      : [...draft.goals, value];
    update("goals", nextGoals);
  };

  return (
    <View className="gap-4">
      <LiquidGlassSurface tone="strong" radius={30} className="p-5">
        <View className="flex-row items-start gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#7c95ff]/16">
            <Pencil size={24} color={MOBILE_COLORS.primarySoft} strokeWidth={2.2} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-semibold uppercase tracking-[2.4px] text-[#f7fbff]/50">
              Modifica guidata
            </Text>
            <Text className="mt-2 text-2xl font-bold leading-8 text-[#f7fbff]">
              Aggiorna quello che serve, senza passaggi inutili.
            </Text>
          </View>
        </View>
      </LiquidGlassSurface>

      <FormSection icon={HeartPulse} title="Contesto clinico">
        <OptionGroup
          label="Stato clinico"
          value={draft.clinicalStatus}
          options={CLINICAL_STATUS_OPTIONS}
          onChange={(value) => update("clinicalStatus", value)}
        />
        <OptionGroup
          label="Sesso biologico"
          value={draft.sex}
          options={SEX_OPTIONS}
          compact
          onChange={(value) => update("sex", value)}
        />
        <ProfileInput
          label="Condizioni o note cliniche"
          value={draft.conditions}
          onChangeText={(value) => update("conditions", value)}
          placeholder="Es. diabete, nausea frequente, terapie in corso"
          multiline
        />
      </FormSection>

      <FormSection icon={Ruler} title="Misure">
        <View className="flex-row gap-3">
          <ProfileInput
            label="Età"
            value={draft.age}
            onChangeText={(value) => update("age", value)}
            placeholder="35"
            keyboardType="numeric"
            className="flex-1"
          />
          <ProfileInput
            label="Altezza"
            value={draft.height}
            onChangeText={(value) => update("height", value)}
            placeholder="165"
            suffix="cm"
            keyboardType="decimal-pad"
            className="flex-1"
          />
        </View>
        <ProfileInput
          label="Peso"
          value={draft.weight}
          onChangeText={(value) => update("weight", value)}
          placeholder="65"
          suffix="kg"
          keyboardType="decimal-pad"
        />
        <ProfileInput
          label="Gruppo sanguigno"
          value={draft.bloodType}
          onChangeText={(value) => update("bloodType", value)}
          placeholder="Es. A+, 0-"
        />
      </FormSection>

      <FormSection icon={ActivitySquare} title="Energia quotidiana">
        <OptionGroup
          label="Attività"
          value={draft.activityLevel}
          options={ACTIVITY_OPTIONS}
          onChange={(value) => update("activityLevel", value)}
        />
        <OptionGroup
          label="Obiettivi"
          value={null}
          options={GOAL_OPTIONS}
          compact
          selectedValues={draft.goals}
          onToggle={toggleGoal}
        />
      </FormSection>

      <FormSection icon={Apple} title="Nutrizione">
        <OptionGroup
          label="Stile alimentare"
          value={draft.dietPreference}
          options={DIET_OPTIONS}
          compact
          onChange={(value) => update("dietPreference", value)}
        />
        <OptionGroup
          label="Colazione"
          value={draft.breakfastPreference}
          options={BREAKFAST_OPTIONS}
          compact
          onChange={(value) => update("breakfastPreference", value)}
        />
        <ProfileInput
          label="Allergie"
          value={draft.allergies}
          onChangeText={(value) => update("allergies", value)}
          placeholder="Es. frutta secca, lattosio"
          multiline
        />
        <ProfileInput
          label="Restrizioni"
          value={draft.dietaryRestrictions}
          onChangeText={(value) => update("dietaryRestrictions", value)}
          placeholder="Es. senza glutine, basso sodio"
          multiline
        />
        <ProfileInput
          label="Alimenti da evitare"
          value={draft.dislikes}
          onChangeText={(value) => update("dislikes", value)}
          placeholder="Es. broccoli, pesce crudo"
          multiline
        />
      </FormSection>

      {invalidNumbers ? (
        <Text className="text-sm font-semibold text-[#ec8f64]">
          Controlla età, altezza e peso: devono essere numeri validi.
        </Text>
      ) : null}
      {error ? (
        <Text className="text-sm font-semibold text-[#ec8f64]">
          Non sono riuscito a salvare il profilo sanitario. Riprova tra poco.
        </Text>
      ) : null}
      <EditorActions
        saving={saving}
        disabled={saving || invalidNumbers}
        onCancel={onCancel}
        onSave={onSave}
      />
    </View>
  );
}

function ProfileInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  suffix,
  className,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
  suffix?: string;
  className?: string;
}) {
  return (
    <View className={className}>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/50">
        {label}
      </Text>
      <View className="flex-row items-center rounded-2xl border border-[#d8e3f4]/18 bg-[#f7fbff]/[0.06] px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(247,251,255,0.35)"
          selectionColor={MOBILE_COLORS.primary}
          keyboardType={keyboardType}
          multiline={multiline}
          className={
            multiline
              ? "min-h-24 flex-1 py-4 text-base font-semibold leading-6 text-[#f7fbff]"
              : "flex-1 py-4 text-base font-semibold text-[#f7fbff]"
          }
        />
        {suffix ? (
          <Text className="pl-2 text-sm font-semibold text-[#f7fbff]/40">
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <LiquidGlassSurface radius={28} className="p-5">
      <SectionTitle icon={Icon} label={title} />
      <View className="mt-4 gap-4">{children}</View>
    </LiquidGlassSurface>
  );
}

function OptionGroup({
  label,
  value,
  options,
  compact,
  selectedValues,
  onChange,
  onToggle,
}: {
  label: string;
  value: string | null;
  options: ProfileOption[];
  compact?: boolean;
  selectedValues?: string[];
  onChange?: (value: string | null) => void;
  onToggle?: (value: string) => void;
}) {
  return (
    <View>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/50">
        {label}
      </Text>
      <View className={compact ? "flex-row flex-wrap gap-2" : "gap-2.5"}>
        {options.map((option) => {
          const selected = selectedValues
            ? selectedValues.includes(option.value)
            : value === option.value;
          return (
            <OptionChip
              key={option.value}
              option={option}
              selected={selected}
              compact={compact}
              onPress={() => {
                if (selectedValues) {
                  onToggle?.(option.value);
                  return;
                }
                onChange?.(selected ? null : option.value);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function OptionChip({
  option,
  selected,
  compact,
  onPress,
}: {
  option: ProfileOption;
  selected: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      onPress={() => {
        onPress();
        void Haptics.selectionAsync();
      }}
      className={
        selected
          ? compact
            ? "rounded-full bg-[#f7fbff] px-4 py-2.5"
            : "rounded-3xl border border-[#f7fbff]/70 bg-[#f7fbff] px-4 py-3.5"
          : compact
            ? "rounded-full border border-[#d8e3f4]/18 bg-[#f7fbff]/[0.06] px-4 py-2.5"
            : "rounded-3xl border border-[#d8e3f4]/16 bg-[#f7fbff]/[0.045] px-4 py-3.5"
      }
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
    >
      <Text
        className={
          selected
            ? compact
              ? "text-sm font-bold text-[#0d1424]"
              : "text-base font-bold text-[#0d1424]"
            : compact
              ? "text-sm font-semibold text-[#f7fbff]/80"
              : "text-base font-semibold text-[#f7fbff]/80"
        }
      >
        {option.label}
      </Text>
      {!compact && option.description ? (
        <Text
          className={
            selected
              ? "mt-1 text-xs font-medium text-[#0d1424]/60"
              : "mt-1 text-xs leading-5 text-[#f7fbff]/50"
          }
        >
          {option.description}
        </Text>
      ) : null}
    </MotionPressable>
  );
}

function EditorActions({
  saving,
  disabled,
  onCancel,
  onSave,
}: {
  saving: boolean;
  disabled: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <View className="flex-row gap-2">
      <MotionPressable
        onPress={onCancel}
        disabled={saving}
        className="flex-1 rounded-2xl border border-[#d8e3f4]/18 py-3.5"
        accessibilityRole="button"
        accessibilityLabel="Annulla modifica"
      >
        <Text className="text-center text-sm font-semibold text-[#f7fbff]/70">
          Annulla
        </Text>
      </MotionPressable>
      <MotionPressable
        onPress={onSave}
        disabled={disabled}
        className={
          disabled
            ? "flex-1 rounded-2xl bg-[#7c95ff]/35 py-3.5"
            : "flex-1 rounded-2xl bg-[#7c95ff] py-3.5"
        }
        accessibilityRole="button"
        accessibilityLabel="Salva modifiche"
      >
        {saving ? (
          <ActivityIndicator color="#0d1424" />
        ) : (
          <Text className="text-center text-sm font-semibold text-[#0d1424]">
            Salva
          </Text>
        )}
      </MotionPressable>
    </View>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <Tile radius={20} className="flex-1 p-3.5">
      <Display size="lg" className="text-[#f4f7fb]">
        {value}
      </Display>
      <Text
        className="mt-0.5 text-[10px] font-semibold uppercase text-[#f4f7fb]/50"
        style={{ letterSpacing: 1.4 }}
      >
        {label}
      </Text>
    </Tile>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm text-[#f7fbff]/50">{label}</Text>
      <Text className="min-w-0 flex-1 text-right text-sm font-semibold text-[#f7fbff]">
        {value}
      </Text>
    </View>
  );
}

function ChipList({
  label,
  values,
  empty,
}: {
  label: string;
  values: string[];
  empty: string;
}) {
  return (
    <View>
      <Text className="mb-2 text-sm text-[#f7fbff]/50">{label}</Text>
      {values.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {values.map((value) => (
            <View
              key={value}
              className="rounded-full border border-[#d8e3f4]/14 bg-[#f7fbff]/[0.06] px-3 py-1.5"
            >
              <Text className="text-xs font-semibold text-[#f7fbff]/80">
                {value}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm font-semibold text-[#f7fbff]/70">{empty}</Text>
      )}
    </View>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon size={16} color="rgba(247,251,255,0.62)" strokeWidth={2.2} />
      <Text className="text-xs font-semibold uppercase tracking-[2.2px] text-[#f7fbff]/50">
        {label}
      </Text>
    </View>
  );
}

function MissingClinicalProfile({ onCreate }: { onCreate: () => void }) {
  return (
    <LiquidGlassSurface radius={30} className="p-6">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#7c95ff]/16">
        <ActivitySquare size={25} color={MOBILE_COLORS.primarySoft} strokeWidth={2.2} />
      </View>
      <Text className="mt-5 text-2xl font-bold leading-8 text-[#f7fbff]">
        Profilo sanitario da completare
      </Text>
      <Text className="mt-2 text-sm leading-6 text-[#f7fbff]/60">
        Aggiungi qui i dati essenziali per rendere nutrizione, eventi e corsi
        piu aderenti alle tue esigenze.
      </Text>
      <MotionPressable
        onPress={onCreate}
        className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl bg-[#7c95ff] px-5 py-4"
        accessibilityRole="button"
        accessibilityLabel="Crea profilo sanitario"
      >
        <Text className="text-base font-semibold text-[#0d1424]">
          Crea profilo
        </Text>
        <ChevronRight size={16} color="#0d1424" strokeWidth={2.6} />
      </MotionPressable>
    </LiquidGlassSurface>
  );
}

function LoadingCard() {
  return (
    <LiquidGlassSurface radius={30} className="items-center p-7">
      <ActivityIndicator color="rgba(247,251,255,0.62)" />
      <Text className="mt-3 text-center text-sm text-[#f7fbff]/50">
        Carico il profilo...
      </Text>
    </LiquidGlassSurface>
  );
}

function ActionRow({
  icon: Icon,
  title,
  subtitle,
  danger,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      onPress={onPress}
      className="active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <LiquidGlassSurface radius={24} className="p-4">
        <View className="flex-row items-center gap-3">
          <View
            className={
              danger
                ? "h-11 w-11 items-center justify-center rounded-2xl bg-[#ec8f64]/15"
                : "h-11 w-11 items-center justify-center rounded-2xl bg-[#7c95ff]/15"
            }
          >
            <Icon
              size={19}
              color={danger ? MOBILE_COLORS.clay : MOBILE_COLORS.primarySoft}
              strokeWidth={2.2}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold text-[#f7fbff]">
              {title}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-[#f7fbff]/50">
              {subtitle}
            </Text>
          </View>
          <ChevronRight size={16} color="rgba(247,251,255,0.4)" strokeWidth={2.2} />
        </View>
      </LiquidGlassSurface>
    </MotionPressable>
  );
}

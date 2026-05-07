import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Shared labelled text field used by every auth form. Owns its own focus
 * state so the active field gets a brighter border. The optional `trailing`
 * slot lets callers drop in a "show password" toggle, a unit suffix, etc.
 */
export type TextFieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  trailing?: React.ReactNode;
  /** Inline error caption rendered below the field. */
  error?: string | null;
  /** Optional hint rendered below the field when no error is present. */
  hint?: string | null;
  containerStyle?: ViewStyle;
};

export const TextField = ({
  ref,
  label,
  trailing,
  error,
  hint,
  containerStyle,
  ...props
}: TextFieldProps & { ref?: React.Ref<TextInput> }) => {
  const [focused, setFocused] = useState(false);

  let wrapperClass: string;
  if (error) {
    wrapperClass =
      "flex-row items-center rounded-2xl border-2 border-[#ec8f64]/80 bg-[#f7fbff]/5 px-4";
  } else if (focused) {
    wrapperClass =
      "flex-row items-center rounded-2xl border-2 border-[#7c95ff] bg-[#f7fbff]/10 px-4";
  } else {
    wrapperClass =
      "flex-row items-center rounded-2xl border-2 border-[#d8e3f4]/20 bg-[#f7fbff]/5 px-4";
  }

  const handleFocus: TextFieldProps["onFocus"] = (event) => {
    setFocused(true);
    props.onFocus?.(event);
  };
  const handleBlur: TextFieldProps["onBlur"] = (event) => {
    setFocused(false);
    props.onBlur?.(event);
  };

  return (
    <View style={containerStyle}>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/60">
        {label}
      </Text>
      <View className={wrapperClass}>
        <TextInput
          ref={ref}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="rgba(247,251,255,0.38)"
          selectionColor="#7c95ff"
          className="flex-1 py-4 text-base text-[#f7fbff]"
        />
        {trailing ? <View className="ml-2">{trailing}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1.5 text-xs text-[#ffc7a7]">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 text-xs text-[#f7fbff]/50">{hint}</Text>
      ) : null}
    </View>
  );
};

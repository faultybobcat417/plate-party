import { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";

import { colors, spacing, theme } from "../../theme";

export type BottomSheetProps = ViewProps & {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ visible, onClose, children, style, ...rest }: BottomSheetProps) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.backdropFill} />
      </Pressable>
      <View style={[styles.sheet, style]} {...rest}>
        <View style={styles.handle} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
  },
  backdropFill: {
    backgroundColor: colors.ink[900],
    flex: 1,
    opacity: 0.4,
  },
  sheet: {
    backgroundColor: colors.linen[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    ...theme.shadows.lg,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.ash[300],
    borderRadius: 2,
    height: 4,
    marginBottom: spacing[3],
    width: 40,
  },
});

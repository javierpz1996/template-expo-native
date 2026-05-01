import { Text, View } from "react-native";

/**
 * Pantalla mínima para comprobar que `className` y el preset de NativeWind aplican bien.
 */
export function NativeWindTest() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Funciona NativeWind 🚀
      </Text>
    </View>
  );
}

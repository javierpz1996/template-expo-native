import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../store";
import type { RootScreen } from "../types/shipment";

export function ChatScreen() {
  const { t } = useTranslation();
  const {
    selectedShipmentId,
    getChatForShipment,
    sendChatMessage,
    setScreen,
    role,
    chatReturnScreen,
  } = useApp();
  const [text, setText] = useState("");

  const shipmentId = selectedShipmentId ?? "";
  const messages = getChatForShipment(shipmentId);

  const handleBack = () => {
    const fallback: RootScreen = role === "driver" ? "driver" : "shipments";
    const returnTo = chatReturnScreen ?? fallback;

    if (returnTo === "shipment-detail") {
      setScreen("shipment-detail", shipmentId);
      return;
    }

    setScreen(returnTo);
  };

  const handleSend = () => {
    const sender = role === "driver" ? "driver" : "client";
    void sendChatMessage(shipmentId, text, sender);
    setText("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.title}>{t("shipment.chat")}</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("shipment.chatEmpty")}</Text>
        }
        renderItem={({ item }) => {
          const mine =
            (role === "driver" && item.sender === "driver") ||
            (role !== "driver" && item.sender === "client");
          return (
            <View
              style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
            >
              <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                {item.text}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={t("shipment.chatPlaceholder")}
          placeholderTextColor="#94A3B8"
        />
        <Pressable style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  list: { padding: 20, gap: 10, flexGrow: 1 },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#0F172A",
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#E2E8F0",
  },
  bubbleText: { color: "#0F172A", fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: "#ffffff" },
  composer: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
});

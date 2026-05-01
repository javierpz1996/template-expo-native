import "./global.css";
import { StatusBar } from "expo-status-bar";
import { NativeWindTest } from "./src/components/NativeWindTest";

export default function App() {
  return (
    <>
      <NativeWindTest />
      <StatusBar style="auto" />
    </>
  );
}

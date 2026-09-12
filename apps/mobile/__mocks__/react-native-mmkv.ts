// Jest manual mock: MMKV's real storage needs the native Nitro module,
// which doesn't exist under Jest. react-native-mmkv ships its own
// createMockMMKV (an in-memory implementation) for exactly this — this
// file just re-exports it under the name storage.ts actually imports, so
// no test needs to know the mock exists.
export { createMockMMKV as createMMKV } from 'react-native-mmkv/lib/createMMKV/createMockMMKV';

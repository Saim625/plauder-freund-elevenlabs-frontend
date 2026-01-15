let wakeLock = null;

export async function enableWakeLock() {
  // 1. Safety check
  if (!("wakeLock" in navigator)) {
    console.warn("Wake Lock API not supported");
    return;
  }

  try {
    // 2. Request the lock
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("🔓 Wake Lock enabled");

    // 3. LISTEN for system release (This is the key fix)
    wakeLock.addEventListener("release", () => {
      console.log("🔒 Wake Lock was released by the system");
      wakeLock = null; // Clear it so we know we need to re-request it later
    });
  } catch (err) {
    console.error(`❌ Wake Lock failed: ${err.name}, ${err.message}`);
  }
}

// 4. Re-acquire logic (Fixed)
document.addEventListener("visibilitychange", async () => {
  if (wakeLock === null && document.visibilityState === "visible") {
    // We only re-enable if the user had it active before leaving
    console.log("♻️ Re-acquiring Wake Lock...");
    await enableWakeLock();
  }
});

/**
 * Disable wake lock (Manual)
 */
export async function disableWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
    console.log("🔒 Wake Lock disabled manually");
  }
}

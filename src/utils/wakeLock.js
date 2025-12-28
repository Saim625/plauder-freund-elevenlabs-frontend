let wakeLock = null;

/**
 * Enable screen wake lock (prevents phone from sleeping)
 */
export async function enableWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");

      console.log("🔓 Wake Lock enabled");

      wakeLock.addEventListener("release", () => {
        console.log("🔒 Wake Lock released");
      });

      // Re-acquire wake lock if tab becomes active again
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible" && wakeLock === null) {
          try {
            wakeLock = await navigator.wakeLock.request("screen");
            console.log("🔓 Wake Lock re-enabled");
          } catch (err) {
            console.error("Wake Lock re-acquire failed:", err);
          }
        }
      });
    } else {
      console.warn("Wake Lock API not supported on this browser");
    }
  } catch (err) {
    console.error("Wake Lock failed:", err);
  }
}

/**
 * Disable wake lock
 */
export async function disableWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
      console.log("🔒 Wake Lock disabled");
    }
  } catch (err) {
    console.error("Failed to release Wake Lock:", err);
  }
}

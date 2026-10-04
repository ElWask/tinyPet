export const api = {
  logState: async ({ message }) => {
    console.log("Pet State:", message);
  }
};

// Runs once the window is up.
export function init(app) {
  app.setAlwaysOnTop(true);
  app.setResizable(false);
  console.log("Procedural pet canvas runtime active.");
}

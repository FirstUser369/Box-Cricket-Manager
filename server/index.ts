import { createApp, log } from "./app";
import { serveStatic } from "./static";

(async () => {
  try {
    const { app, httpServer } = await createApp();

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    let currHost = "";
    if (process.env.NODE_ENV === "production") {
      currHost = "0.0.0.0";
      log(`Starting production server on port ${port}`);
    } else {
      currHost = "127.0.0.1";
      log(`Starting development server on port ${port}`);
    }
    
    httpServer.listen(
      {
        port,
        host: currHost,
      },
      () => {
        log(`serving on port ${port}`);
      },
    );

    httpServer.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

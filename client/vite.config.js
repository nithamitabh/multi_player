export default {
  server: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000", // Proxy requests to your server
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
      },
    },
  },
};

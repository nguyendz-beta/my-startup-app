export const setupSockets = (io: any) => {
  io.on("connection", (socket: any) => {
    console.log("connected", socket.id);
  });
};

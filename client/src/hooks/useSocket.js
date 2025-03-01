import { useEffect, useRef } from "react";
import io from "socket.io-client";

const useSocket = (url, myname) => {
    const socketRef = useRef();

    if (!socketRef.current) {
        socketRef.current = io(url);
    }

    useEffect(() => {
        const socket = socketRef.current;
        // Đăng ký user khi mount
        socket.emit("registerUser", myname);

        return () => {
            socket.disconnect();
        };
    }, [myname]);

    return socketRef.current;
};

export default useSocket;

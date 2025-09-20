import { useContext } from 'react';
import { SocketContext } from '@/app/providers/SoketProvider.jsx';

export const useSocket = () => useContext(SocketContext);

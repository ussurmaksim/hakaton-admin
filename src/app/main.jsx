import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {RouterProvider} from "react-router-dom";
import {router} from '@/app/router/router.jsx'
import StoreProvider from "@/app/providers/storeProvider.jsx";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import StyleProvider from "@/app/providers/StyleProvider.jsx";
import {SocketProvider} from "@/app/providers/SoketProvider.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <StyleProvider>
          <StoreProvider>
              <SocketProvider>
                <RouterProvider router={router} />
              </SocketProvider>
          </StoreProvider>
      </StyleProvider>
  </StrictMode>
)

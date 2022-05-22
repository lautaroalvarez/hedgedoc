/*
 * SPDX-FileCopyrightText: 2022 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import WebSocket from 'ws';

import {
  encodeAwarenessMessage,
  encodeInitialSyncMessage,
} from './encode-utils';
import { RealtimeNote } from './realtime-note';

/**
 * This class warps the connection from a client to a {@link RealtimeNote} and adds some additional methods.
 */
export class WebsocketConnection {
  private pongReceived = true;
  private readonly pingTimeout = 30 * 1000;

  /**
   * Instantiates the websocket connection wrapper for a websocket connection.
   *
   * Besides sending the initial data to the client, a ping-pong connection test is set up.
   *
   * @param websocket The client's raw websocket.
   * @param realtimeNote The {@link RealtimeNote} that the client connected to.
   */
  constructor(
    private websocket: WebSocket,
    private realtimeNote: RealtimeNote,
  ) {
    this.setupPing();
    this.sendInitialSync();
    this.sendAwarenessState();
  }

  /**
   * Sets up a ping-pong connection test.
   *
   * Based on a defined interval a ping-request is sent to the client and a pong response awaited.
   * In case of not receiving the pong back from the client, the websocket connection is closed.
   *
   * @private
   */
  private setupPing(): void {
    const pingInterval = setInterval(() => {
      if (this.pongReceived) {
        this.pongReceived = false;
        try {
          this.websocket.ping();
        } catch (e) {
          this.websocket.close();
        }
      } else {
        this.websocket.close();
      }
    }, this.pingTimeout);
    this.websocket.on('close', () => {
      clearInterval(pingInterval);
    });
    this.websocket.on('pong', () => {
      this.pongReceived = true;
    });
  }

  /**
   * Initializes the Yjs client by sending the first step of the handshake.
   */
  public sendInitialSync(): void {
    this.send(encodeInitialSyncMessage(this.realtimeNote.getYDoc()));
  }

  /**
   * Sends the awareness state of the assigned {@link RealtimeNote} to the client.
   */
  public sendAwarenessState(): void {
    this.send(encodeAwarenessMessage(this.realtimeNote.getAwareness()));
  }

  /**
   * Sends binary data to the client. Closes the connection on errors.
   *
   * @param content The binary data to send.
   */
  public send(content: Uint8Array): void {
    if (this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.websocket.send(content);
    } catch (error: unknown) {
      this.websocket.close();
    }
  }
}

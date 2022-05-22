/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { INestApplication, Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { MessageMappingProperties } from '@nestjs/websockets';
import { decoding } from 'lib0';
import WebSocket, { Server, ServerOptions } from 'ws';

import { MessageType } from './message-type';

export type MessageHandlerCallbackResponse = Promise<Uint8Array | void>;

export class YjsWebsocketAdapter extends WsAdapter {
  protected readonly logger = new Logger(YjsWebsocketAdapter.name);

  constructor(private app: INestApplication) {
    super(app);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
  ): void {
    client.binaryType = 'arraybuffer';
    client.on('message', (data: ArrayBuffer) => {
      const uint8Data = new Uint8Array(data);
      const decoder = decoding.createDecoder(uint8Data);
      const messageType = decoding.readVarUint(decoder);
      const handler = handlers.find(
        (handler) => handler.message === messageType,
      );
      if (!handler) {
        this.logger.error(
          `Message handler for ${MessageType[messageType]} wasn't defined!`,
        );
        return;
      }
      (handler.callback(decoder) as MessageHandlerCallbackResponse)
        .then((response) => {
          if (!response) {
            return;
          }
          client.send(response, {
            binary: true,
          });
        })
        .catch((error: Error) => {
          this.logger.error(
            `An error occurred while handling message: ${String(error)}`,
            error.stack ?? 'no-stack',
            'yjs-websocket-adapter',
          );
        });
    });
  }

  create(port: number, options: ServerOptions): Server {
    this.logger.log('Initiating WebSocket server for realtime communication');
    return super.create(port, options) as Server;
  }
}

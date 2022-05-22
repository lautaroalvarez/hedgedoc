/*
 * SPDX-FileCopyrightText: 2022 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Decoder } from 'lib0/decoding';
import { Doc } from 'yjs';

import { decodeSyncMessage, encodeSyncMessage } from './encode-utils';
import { RealtimeNote } from './realtime-note';
import { WebsocketConnection } from './websocket-connection';

export class WebsocketDoc extends Doc {
  private static readonly channelName = 'codemirror';

  constructor(private realtimeNote: RealtimeNote, initialContent: string) {
    super();
    this.initializeContent(initialContent);
    this.on('update', this.processYDocUpdate.bind(this));
  }

  private initializeContent(initialContent: string): void {
    this.getText(WebsocketDoc.channelName).insert(0, initialContent);
  }

  private processYDocUpdate(
    update: Uint8Array,
    origin: WebsocketConnection,
  ): void {
    const binaryUpdate = encodeSyncMessage(update);
    this.realtimeNote.getConnections().forEach((client) => {
      if (origin !== client) {
        client.send(binaryUpdate);
      }
    });
  }

  public processSyncMessage(
    client: WebsocketConnection,
    decoder: Decoder,
  ): void {
    const response = decodeSyncMessage(decoder, this, client);
    if (response) {
      client.send(response);
    }
  }

  public getCurrentContent(): string {
    return this.getText(WebsocketDoc.channelName).toString();
  }
}

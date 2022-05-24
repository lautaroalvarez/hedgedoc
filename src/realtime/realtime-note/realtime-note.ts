/*
 * SPDX-FileCopyrightText: 2022 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Logger } from '@nestjs/common';
import { Decoder } from 'lib0/decoding';
import WebSocket from 'ws';
import { Awareness } from 'y-protocols/awareness';
import { Doc } from 'yjs';

import { User } from '../../users/user.entity';
import { WebsocketAwareness } from './websocket-awareness';
import { WebsocketConnection } from './websocket-connection';
import { WebsocketDoc } from './websocket-doc';

/**
 * Represents a note currently being edited by a number of clients.
 *
 * It holds references to some classes to handle different kinds of messages.
 */
export class RealtimeNote {
  protected readonly logger = new Logger(RealtimeNote.name);
  private readonly websocketDoc: WebsocketDoc;
  private readonly websocketAwareness: WebsocketAwareness;
  private readonly clients = new Map<WebSocket, WebsocketConnection>();

  constructor(private readonly noteId: string, initialContent: string) {
    this.websocketDoc = new WebsocketDoc(this, initialContent);
    this.websocketAwareness = new WebsocketAwareness(this);
    this.logger.log(`New realtime note for ${noteId} created.`);
  }

  /**
   * Connects a new client to the note.
   *
   * For this purpose a {@link WebsocketConnection} is created and added to the client map.
   *
   * @param client the websocket connection to the client
   * @param user the user who authorized this client
   */
  public connectClient(client: WebSocket, user: User): void {
    this.logger.log(`New client connected`);
    this.clients.set(client, new WebsocketConnection(client, user, this));
  }

  /**
   * Send a sync message to the {@link WebsocketDoc}
   *
   * @param client the websocket connection to the client the message came from
   * @param decoder the decoder of the message
   */
  public processSyncMessage(client: WebSocket, decoder: Decoder): void {
    const connection = this.clients.get(client);
    if (!connection) {
      throw new Error('Received SYNC for unknown connection');
    }
    this.websocketDoc.processIncomingSyncMessage(connection, decoder);
  }

  /**
   * Send an awareness message to the {@link WebsocketAwareness}
   *
   * @param client the websocket connection to the client the message came from
   * @param decoder the decoder of the message
   */
  public processAwarenessMessage(client: WebSocket, decoder: Decoder): void {
    const connection = this.clients.get(client);
    if (!connection) {
      throw new Error('Received AWARENESS for unknown connection');
    }
    this.websocketAwareness.processIncomingAwarenessMessage(
      connection,
      decoder,
    );
  }

  /**
   * Disconnects the given websocket client while cleaning-up if it was the last user in the realtime note.
   *
   * @param {WebSocket} client The websocket client that disconnects.
   * @param {() => void} onDestroy Will be executed if the realtime note is empty and should be deleted.
   */
  public removeClient(client: WebSocket, onDestroy: () => void): void {
    this.clients.delete(client);

    this.logger.log(`Client disconnected. ${this.clients.size} left.`);
    if (!this.hasConnections()) {
      this.logger.log(`No more connections left. Destroying yDoc.`);
      this.websocketDoc.destroy();
      onDestroy();
    }
  }

  /**
   * Checks if there's still clients connected to this note.
   *
   * @return {@code true} if there a still clinets connected, otherwise {@code false}
   */
  public hasConnections(): boolean {
    return this.clients.size !== 0;
  }

  /**
   * Returns the internal note id of this realtime note instance.
   *
   * @return The internal uuid of the note.
   */
  public getNoteId(): string {
    return this.noteId;
  }

  /**
   * Returns all {@link WebsocketConnection WebsocketConnections} currently hold by this note.
   *
   * @return an array of {@link WebsocketConnection WebsocketConnections}
   */
  public getConnections(): WebsocketConnection[] {
    return [...this.clients.values()];
  }

  /**
   * Get the {@link Doc YDoc} of the note.
   *
   * @return the {@link Doc YDoc} of the note
   */
  public getYDoc(): Doc {
    return this.websocketDoc;
  }

  /**
   * Get the {@link Awareness YAwareness} of the note.
   *
   * @return the {@link Awareness YAwareness} of the note
   */
  public getAwareness(): Awareness {
    return this.websocketAwareness;
  }

  /**
   * Get the current content of the note.
   *
   * @return current content of the note
   */
  public getNoteContent(): string {
    return this.websocketDoc.getCurrentContent();
  }
}

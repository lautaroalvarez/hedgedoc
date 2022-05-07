/*
 * SPDX-FileCopyrightText: 2022 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';

import { RealtimeNote } from './realtime-note';

@Injectable()
export class RealtimeNoteService {
  private noteIdToRealtimeNote = new Map<string, RealtimeNote>();

  public async getOrCreateRealtimeNote(
    noteId: string,
    initialContentReceiver: () => Promise<string>,
  ): Promise<RealtimeNote> {
    const realtimeNote = this.noteIdToRealtimeNote.get(noteId);
    if (!realtimeNote) {
      const initialContent = await initialContentReceiver();
      const realtimeNote = new RealtimeNote(noteId, initialContent);
      this.noteIdToRealtimeNote.set(noteId, realtimeNote);
      return realtimeNote;
    } else {
      return realtimeNote;
    }
  }

  public getRealtimeNote(noteId: string): RealtimeNote | undefined {
    return this.noteIdToRealtimeNote.get(noteId);
  }

  public deleteNote(noteId: string): void {
    this.noteIdToRealtimeNote.delete(noteId);
  }
}

/*
 * SPDX-FileCopyrightText: 2022 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Test, TestingModule } from '@nestjs/testing';

import { RealtimeWebsocketGateway } from './realtime-websocket.gateway';

describe('RealtimeEditorGateway', () => {
  let gateway: RealtimeWebsocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtimeWebsocketGateway],
    }).compile();

    gateway = module.get<RealtimeWebsocketGateway>(RealtimeWebsocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});

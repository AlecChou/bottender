/* @flow */

import wait from 'delay';
import { LINEClient } from 'messaging-api-line';

import Session from '../session/Session';

import Context, { DEFAULT_MESSAGE_DELAY } from './Context';
import LINEEvent, { type RawLINEEvent } from './LINEEvent';
import DelayableJobQueue from './DelayableJobQueue';

type Options = {
  lineAPIClient: LINEClient,
  rawEvent: RawLINEEvent,
  session: Session,
};

export default class LINEContext extends Context {
  _client: LINEClient;
  _event: LINEEvent;
  _session: Session;
  _jobQueue: DelayableJobQueue;

  constructor({ lineAPIClient, rawEvent, session }: Options) {
    super({ session });
    this._client = lineAPIClient;
    this._event = new LINEEvent(rawEvent);
    this._jobQueue.beforeEach(({ delay }) => wait(delay));
    const types = [
      'Text',
      'Image',
      'Video',
      'Audio',
      'Location',
      'Sticker',
      'Imagemap',
      'ButtonTemplate',
      'ConfirmTemplate',
      'CarouselTemplate',
    ];
    types.forEach(type => {
      Object.defineProperty(this, `send${type}`, {
        enumerable: false,
        configurable: true,
        writable: true,
        value(...args) {
          this._enqueue({
            instance: this._client,
            method: `push${type}`,
            args: [this._session.user.id, ...args],
            delay: DEFAULT_MESSAGE_DELAY,
            showIndicators: true,
          });
        },
      });

      Object.defineProperty(this, `send${type}To`, {
        enumerable: false,
        configurable: true,
        writable: true,
        value(id, ...rest) {
          this._enqueue({
            instance: this._client,
            method: `push${type}`,
            args: [id, ...rest],
            delay: 0,
            showIndicators: false,
          });
        },
      });

      Object.defineProperty(this, `send${type}WithDelay`, {
        enumerable: false,
        configurable: true,
        writable: true,
        value(delay, ...rest) {
          this._enqueue({
            instance: this._client,
            method: `push${type}`,
            args: [this._session.user.id, ...rest],
            delay,
            showIndicators: true,
          });
        },
      });
    });
  }

  get event(): LINEEvent {
    return this._event;
  }
}
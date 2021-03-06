import SignInComponent from './gatekeeper-sign-in';
import { action } from '@ember/object';
import { tracked } from "@glimmer/tracking";

import recaptchaFactory from "../-lib/recaptcha";

export default class GatekeeperSignInWithRecaptchaComponent extends SignInComponent {
  @tracked
  resetRecaptcha;

  @tracked
  executeRecaptcha;

  _recaptchaImpl;

  doPrepareComponent () {
    this._recaptchaImpl = recaptchaFactory (this.recaptcha);
  }

  willSignIn () {
    return this._recaptchaImpl.verify (this);
  }

  reset () {
    super.reset ();

    this.resetRecaptcha = true;
  }

  get recaptcha () {
    return this.args.recaptcha || 'invisible';
  }

  get v2 () {
    return this.recaptcha === 'v2';
  }

  get invisible () {
    return this.recaptcha === 'invisible';
  }

  @action
  verified (response) {
    this._recaptchaImpl.verified (response);
  }

  doPrepareOptions (options) {
    return Object.assign ({}, options, { recaptcha: this._recaptchaImpl.response });
  }

  isSignInDisabled () {
    return this._recaptchaImpl.isNextDisabled ();
  }
}

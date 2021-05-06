import Component from '@glimmer/component';
import { tracked } from "@glimmer/tracking";

import { action, get } from '@ember/object';
import { isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';

function identity (value) {
  return () => value ;
}

/**
 * @class GatekeeperSignInComponent
 */
export default class GatekeeperSignInComponent extends Component {
  @tracked
  valid;

  @tracked
  submitting

  @tracked
  username;

  @tracked
  password;

  get signInOptions () {
    return this.args.signInOptions || {};
  }

  //== username properties

  get usernameLabel () {
    return this.args.usernameLabel || 'Username';
  }

  get usernameType () {
    return this.args.usernameType || 'text';
  }

  get usernameAutoComplete () {
    return this.args.usernameAutoComplete || 'off';
  }

  @action
  usernameLeadingIconClick () {
    return this.args.usernameLeadingIconClick || identity;
  }

  @action
  usernameTrailingIconClick () {
    return this.args.usernameTrailingIconClick || identity;
  }

  //== password properties

  get passwordLabel () {
    return this.args.passwordLabel || 'Password'
  }

  //== sign-in button

  get signInButtonText () {
    return this.args.signInButtonText || 'Sign In';
  }

  isSignInDisabled () {
    return false;
  }

  get signInButtonDisabled () {
    return this.submitting || !this.valid || this.args.signInDisabled || this.isSignInDisabled ();
  }

  //== sign-up button

  get showSignUpButton () {
    return this.args.showSignUpButton || false;
  }

  get signUpButtonText () {
    return this.args.signUpButtonText || 'Sign Up';
  }

  @service
  router;

  @service
  session;

  @service
  snackbar;

  @action
  didInsert (element) {
    this.valid = false;
    this.submitting = false;

    this.username = this.args.username;
    this.password = this.args.password;

    this.doPrepareComponent (element);
  }

  doPrepareComponent (/* element */) {

  }

  @tracked
  usernameErrorMessage;

  @tracked
  passwordErrorMessage;
  
  handleError (xhr) {
    let error = get (xhr, 'errors.0');

    if (isPresent (error)) {
      switch (error.code) {
        case 'invalid_username':
          this.usernameErrorMessage = error.detail;
          break;

        case 'invalid_password':
          this.passwordErrorMessage = error.detail;
          break;

        default:
          this.snackbar.show ({ message: error.detail, dismiss: true});
      }
    }
    else {
      this.snackbar.show ({ message: xhr.message || xhr.statusText, dismiss: true});
    }
  }

  @action
  signIn () {
    let { username, password, signInOptions } = this;
    username = username.trim ();

    let options = Object.assign ({}, signInOptions, { username, password });

    this.submitting = true;

    return Promise.resolve ()
      .then (() => {
        // Reset the component.
        this.reset ();

        // Notify the subclass we are signing in.
        return this.willSignIn (username);
      })
      .then (() => this.doPrepareOptions (options))
      .then (options => this.session.signIn (options))
      .then (() => this.didSignIn (username))
      .then (() => {
        // Notify the subclass that the user did sign in to the application.
        if (this.signInComplete ()) {
          this.session.gatekeeper.redirect (this.args.redirectTo);
        }
      })
      .catch (reason => {
        this.submitting = false;

        this.handleError (reason);
      });
  }

  reset () {
    this.usernameErrorMessage = this.passwordErrorMessage = null;
  }

  willSignIn (username) {
    return (this.args.signInStart || identity) (username);
  }

  doPrepareOptions (options) {
    return options;
  }

  didSignIn (username) {
    return (this.args.signInEnd || identity) (username);
  }

  get signInComplete () {
    return this.args.signInComplete || identity (true);
  }

  @action
  validity (valid) {
    this.valid = valid;
  }

  get forgotPasswordLabel () {
    return this.args.forgotPasswordLabel || 'Forgot password?';
  }
}

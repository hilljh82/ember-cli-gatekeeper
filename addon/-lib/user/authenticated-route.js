import { getOwner } from '@ember/application';
import { isNone, isEmpty, isPresent } from '@ember/utils';
import { computed, get, getWithDefault } from '@ember/object';
import Material from 'ember-cli-mdl';

const bearerErrorCodes = [
  'invalid_token',
  'unknown_token',
  'token_disabled',
  'unknown_client',
  'client_disabled',
  'unknown_account',
  'account_disabled'
];

export default Material.Route.extend ({
  capabilities: [],

  concatenatedProperties: ['capabilities'],

  currentUser: computed ('session.currentUser', function () {
    let currentUser = this.get ('session.currentUser');

    if (isNone (currentUser)) {
      return null;
    }

    let store = this.get ('store');
    let data = store.normalize ('account', currentUser);
    data.data.id = currentUser.id;

    return store.push (data);
  }),

  init () {
    this._super (...arguments);

    this.get ('session').on ('signedOut', this, 'didSignOut');
  },

  destroy () {
    this._super (...arguments);

    this.get ('session').off ('signedOut', this, 'didSignOut');
  },

  beforeModel (transition) {
    this._super (...arguments);
    this._checkSignedIn (transition);

    if (!this._checkCapabilities ()) {
      this.missingCapability (transition);
    }
  },

  missingCapability (transition) {
    alert ('Sorry! You do not have access to this page.');
    transition.abort ();
  },

  actions: {
    error (reason, transition) {
      let errors = get (reason, 'errors');

      if (isEmpty (errors))
        return true;

      for (let i = 0, len = errors.length; i < len; ++ i) {
        let error = errors[i];

        if (error.status === '403' && bearerErrorCodes.indexOf (error.code) !== -1) {
          // Redirect to sign in page, allowing the user to redirect back to the
          // original page. But, do not support the back button.
          let ENV = getOwner (this).resolveRegistration ('config:environment');
          let signInRoute = getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');
          let signInController = this.controllerFor (signInRoute);

          signInController.setProperties ({
            redirectTo: transition,
            errorMessage: error.detail
          });

          // Force the user to sign out.
          this.get ('session').forceSignOut ();
          this.replaceWith (signInRoute);
          return;
        }
      }

      return true;
    }
  },

  didSignOut () {

  },

  _checkSignedIn (transition) {
    let isSignedIn = this.get ('session.isSignedIn');

    if (!isSignedIn) {
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      let signInRoute = getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');
      let signInController = this.controllerFor (signInRoute);

      // Set the redirect to route so we can come back to this route when the
      // user has signed in.
      if (isPresent (signInController)) {
        signInController.set ('redirectTo', transition);
      }

      this.replaceWith (signInRoute);
    }
  },

  _checkCapabilities () {
    let capabilities = this.get ('capabilities');
    return isEmpty (capabilities) ? true : this.get ('session.metadata').hasCapability (capabilities);
  }
});

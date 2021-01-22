import { get, getWithDefault, set } from '@ember/object';
import { isEmpty, isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

import { Mixin as M } from 'base-object';
import { isFunction, isPlainObject } from 'lodash-es';

const bearerErrorCodes = [
  'invalid_token',
  'unknown_token',
  'token_disabled',
  'unknown_client',
  'client_disabled',
  'unknown_account',
  'account_disabled'
];

const AuthenticatedMixin = M.create ({
  snackbar: service (),

  beforeModel (transition) {
    this._super (...arguments);

    this._checkSignedIn (transition);

    let authorized = isPresent (this.authorizations.scope) ?
      this.session.accessToken.supports (this.authorizations.scope) :
      true;

    let controller = this.controllerFor (this.routeName, true);

    if (isPresent (controller)) {
      set (controller, 'isAuthorized', authorized);
    }

    if (!authorized) {
      transition.trigger ('unauthorized', transition);
    }
  },

  actions: {
    error (reason) {
      let errors = get (reason, 'errors');

      if (isEmpty (errors)) {
        return true;
      }

      for (let i = 0, len = errors.length; i < len; ++ i) {
        let error = errors[i];

        if (error.status === '403' && bearerErrorCodes.indexOf (error.code) !== -1) {
          // Redirect to sign in page, allowing the user to redirect back to the
          // original page. But, do not support the back button.
          let ENV = getOwner (this).resolveRegistration ('config:environment');
          let signInRoute = getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');

          // Display the error message.
          this.snackbar.show ({message: error.detail});

          // Force the user to sign out.
          this.session.signOut (true).then (() => {
            this.replaceWith (signInRoute);
          });

          return;
        }
      }

      return true;
    }
  },

  /**
   * Check that the current user is authenticated.
   *
   * @param transition
   * @private
   */
  _checkSignedIn (transition) {
    let isSignedIn = get (this, 'session.isSignedIn');

    if (!isSignedIn) {
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      let signInRoute = getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');

      // Set the redirect to route so we can come back to this route when the
      // user has signed in.
      const queryParams = { redirect: transition.targetName };
      this.replaceWith (signInRoute, { queryParams });
    }
  },
});

function applyMixin (Clazz, options = {}) {
  AuthenticatedMixin.apply (Clazz.prototype);

  let { scope } = options;
  Object.assign (Clazz.prototype, { authorizations: { scope } });
}

export default function authenticated (param) {
  if (isFunction (param)) {
    return applyMixin (param);
  }
  else if (isPlainObject (param)) {
    return function (Route) {
      return applyMixin (Route, param);
    }
  }
}
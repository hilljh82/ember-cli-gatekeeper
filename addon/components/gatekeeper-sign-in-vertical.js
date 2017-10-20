import SignInComponent from '../-lib/components/sign-in';
import layout from '../templates/components/gatekeeper-sign-in-vertical';

export default SignInComponent.extend ({
  layout,

  classNames: ['sign-in-form-vertical'],

  submitButtonType: 'raised',

  submitButtonRippleEffect: true,

  submitButtonAccent: true
});

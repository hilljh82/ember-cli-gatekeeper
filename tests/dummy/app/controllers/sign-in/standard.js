import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from "@glimmer/tracking";

export default class SignInStandardController extends Controller {
  queryParams = Object.freeze ( ['redirect'])

  @tracked
  signInOptions;

  @action
  signUp () {
    alert ('Sign up clicked!');
  }
}


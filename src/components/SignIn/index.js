import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { SignUpLink } from '../SignUp';
import { PasswordForgetLink } from '../PasswordForget';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

const SignInPage = () => (
  <div>
    <h1>SignIn</h1>
    <SignInForm />
    <SignInGoogle />
    <SignInFacebook />
    <SignInTwitter />
    <PasswordForgetLink />
    <SignUpLink />
  </div>
);

const INITIAL_STATE = {
  email: '',
  password: '',
  error: null
};

// Social signin errors
const ERROR_CODE_ACCOUNT_EXISTS =
  'auth/account-exists-with-different-credential';

const ERROR_MSG_ACCOUNT_EXISTS = `
An account with an E-Mail address to
this social account already exists. Please login from
this account instead and associate your social accounts on
your personal account page.
`;

const SignInFormBase = props => {
  const [formValues, setFormValues] = useState(INITIAL_STATE);
  const [error, setError] = useState(null);

  const onSubmit = event => {
    event.preventDefault();

    const { email, password } = formValues;

    props.firebase
      .doSignInWithEmailAndPassword(email, password)
      .then(() => {
        setFormValues({ ...INITIAL_STATE });
        props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        setError(error);
      });
  };

  const onChange = event => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  };

  const { email, password } = formValues;
  const isInvalid = password === '' || email === '';

  return (
    <form onSubmit={onSubmit}>
      <input
        name='email'
        value={email}
        onChange={onChange}
        type='text'
        placeholder='Email Address'
      />
      <input
        name='password'
        value={password}
        onChange={onChange}
        type='password'
        placeholder='Password'
      />
      <button disabled={isInvalid} type='submit'>
        Sign In
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
};

const SignInGoogleBase = props => {
  const [error, setError] = useState(null);

  const onSubmit = event => {
    props.firebase
      .doSignInWithGoogle()
      .then(socialAuthUser => {
        // Create a user in your Firebase Realtime Database too
        return props.firebase.user(socialAuthUser.user.uid).set({
          username: socialAuthUser.user.displayName,
          email: socialAuthUser.user.email,
          roles: {}
        });
      })
      .then(() => {
        setError({ error: null });
        props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
          error.message = ERROR_MSG_ACCOUNT_EXISTS;
        }

        setError(error);
      });
    event.preventDefault();
  };

  return (
    <form onSubmit={onSubmit}>
      <button type='submit'>Sign In with Google</button>
      {error && <p>{error.message}</p>}
    </form>
  );
};

const SignInFacebookBase = props => {
  const [error, setError] = useState(null);

  const onSubmit = event => {
    props.firebase
      .doSignInWithFacebook()
      .then(socialAuthUser => {
        // Create a user in your Firebase Realtime Database too
        return props.firebase.user(socialAuthUser.user.uid).set({
          username: socialAuthUser.additionalUserInfo.profile.name,
          email: socialAuthUser.additionalUserInfo.profile.email,
          roles: {}
        });
      })
      .then(() => {
        setError({ error: null });
        props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
          error.message = ERROR_MSG_ACCOUNT_EXISTS;
        }

        setError(error);
      });
    event.preventDefault();
  };

  return (
    <form onSubmit={onSubmit}>
      <button type='submit'>Sign In with Facebook</button>
      {error && <p>{error.message}</p>}
    </form>
  );
};

const SignInTwitterBase = props => {
  const [error, setError] = useState(null);

  const onSubmit = event => {
    props.firebase
      .doSignInWithTwitter()
      .then(socialAuthUser => {
        // Create a user in your Firebase Realtime Database too
        return props.firebase.user(socialAuthUser.user.uid).set({
          username: socialAuthUser.additionalUserInfo.profile.name,
          email: socialAuthUser.additionalUserInfo.profile.email,
          roles: {}
        });
      })

      .then(() => {
        setError({ error: null });
        props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        if (error.code === ERROR_CODE_ACCOUNT_EXISTS) {
          error.message = ERROR_MSG_ACCOUNT_EXISTS;
        }

        setError(error);
      });
    event.preventDefault();
  };

  return (
    <form onSubmit={onSubmit}>
      <button type='submit'>Sign In with Twitter</button>
      {error && <p>{error.message}</p>}
    </form>
  );
};

const SignInForm = compose(
  withRouter,
  withFirebase
)(SignInFormBase);

const SignInGoogle = compose(
  withRouter,
  withFirebase
)(SignInGoogleBase);

const SignInFacebook = compose(
  withRouter,
  withFirebase
)(SignInFacebookBase);

const SignInTwitter = compose(
  withRouter,
  withFirebase
)(SignInTwitterBase);

export default SignInPage;

export { SignInForm, SignInGoogle, SignInFacebook, SignInTwitter };

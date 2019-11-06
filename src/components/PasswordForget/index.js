import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

const PasswordForgetPage = () => (
  <div>
    <h1>Password Forget</h1>
    <PasswordForgetForm />
  </div>
);

const INITIAL_STATE = {
  email: ''
};

const PasswordForgetFormBase = props => {
  const [formValues, setFormValues] = useState(INITIAL_STATE);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = event => {
    const { email } = formValues;
    props.firebase
      .doPasswordReset(email)
      .then(() => {
        setFormValues({ ...INITIAL_STATE });
        setSubmitted(true);
      })
      .catch(error => {
        setError(error);
      });
    event.preventDefault();
  };

  const onChange = event => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  };

  const { email } = formValues;
  const isInvalid = email === '';

  return (
    <form onSubmit={onSubmit}>
      <input
        name='email'
        value={formValues.email}
        onChange={onChange}
        type='text'
        placeholder='Email Address'
      />
      <button disabled={isInvalid} type='submit'>
        Reset My Password
      </button>
      {error && <p>{error.message}</p>}
      {submitted && <p>Check your email for a link to reset your password.</p>}
    </form>
  );
};

const PasswordForgetLink = () => (
  <p>
    <Link to={ROUTES.PASSWORD_FORGET}>Forgot Password?</Link>
  </p>
);

export default PasswordForgetPage;

const PasswordForgetForm = withFirebase(PasswordForgetFormBase);

export { PasswordForgetForm, PasswordForgetLink };

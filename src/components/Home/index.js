import React, { Component } from 'react';

import { compose } from 'recompose';
import {
  AuthUserContext,
  withAuthorization,
  withEmailVerification
} from '../Session';
import { withFirebase } from '../Firebase';

const HomePage = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>The home page is accessible by every signed in user.</p>

      <Messages />
    </div>
  );
};

class MessagesBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: '',
      loading: false,
      messages: [],
      limit: 5
    };
  }

  componentDidMount() {
    this.onListenForMessages();
  }

  componentWillUnmount() {
    this.props.firebase.messages().off();
  }

  onListenForMessages() {
    this.setState({ loading: true });
    this.props.firebase
      .messages()
      .orderByChild('createdAt')
      .limitToLast(this.state.limit)
      .on('value', snapshot => {
        const messageObject = snapshot.val();
        if (messageObject) {
          const messageList = Object.keys(messageObject).map(key => ({
            ...messageObject[key],
            uid: key
          }));

          // convert messages list from snapshot
          this.setState({
            messages: messageList.reverse(),
            loading: false
          });
        } else {
          this.setState({ messages: null, loading: false });
        }
      });
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onNextPage = () => {
    this.setState(
      state => ({ limit: state.limit + 5 }),
      this.onListenForMessages
    );
  };

  onCreateMessage = (event, authUser) => {
    this.props.firebase.messages().push({
      text: this.state.text,
      userId: authUser.uid,
      createdAt: this.props.firebase.serverValue.TIMESTAMP
    });

    this.setState({ text: '' });

    event.preventDefault();
  };

  onRemoveMessage = uid => {
    this.props.firebase.message(uid).remove();
  };

  onEditMessage = (message, text) => {
    const { uid, ...messageSnapshot } = message;
    this.props.firebase.message(message.uid).set({
      ...messageSnapshot,
      text,
      editedAt: this.props.firebase.serverValue.TIMESTAMP
    });
  };

  render() {
    const { text, messages, loading } = this.state;

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            {!loading && messages && (
              <button type='button' onClick={this.onNextPage}>
                More
              </button>
            )}

            {loading && <div>Loading ...</div>}

            {messages ? (
              <MessageList
                authUser={authUser}
                messages={messages}
                onRemoveMessage={this.onRemoveMessage}
                onEditMessage={this.onEditMessage}
              />
            ) : (
              <div>There are no messages ...</div>
            )}

            <form onSubmit={event => this.onCreateMessage(event, authUser)}>
              <input type='text' value={text} onChange={this.onChangeText} />
              <button type='submit'>Send</button>
            </form>
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const MessageList = ({
  authUser,
  messages,
  onRemoveMessage,
  onEditMessage
}) => (
  <ul>
    {messages.map(message => (
      <MessageItem
        authUser={authUser}
        key={message.uid}
        message={message}
        onRemoveMessage={onRemoveMessage}
        onEditMessage={onEditMessage}
      />
    ))}
  </ul>
);

class MessageItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editMode: false,
      editText: this.props.message.text
    };
  }

  onToggleEditMode = () => {
    this.setState(state => ({
      editMode: !state.editMode,
      editText: this.props.message.text
    }));
  };

  onChangeEditText = event => {
    this.setState({ editText: event.target.value });
  };

  onSaveEditText = () => {
    this.props.onEditMessage(this.props.message, this.state.editText);
    this.setState({ editMode: false });
  };

  render() {
    const { authUser, message, onRemoveMessage } = this.props;
    const { editMode, editText } = this.state;

    return (
      <li>
        {editMode ? (
          <input
            type='text'
            value={editText}
            onChange={this.onChangeEditText}
          />
        ) : (
          <span>
            <strong>{authUser.username || message.userId}</strong>
            {message.text} {message.editedAt && <span>(Edited)</span>}
          </span>
        )}

        {authUser.uid === message.userId && (
          <span>
            {editMode ? (
              <span>
                <button onClick={this.onSaveEditText}>Save</button>
                <button onClick={this.onToggleEditMode}>Reset</button>
              </span>
            ) : (
              <button onClick={this.onToggleEditMode}>Edit</button>
            )}

            {!editMode && (
              <button
                type='button'
                onClick={() => onRemoveMessage(message.uid)}
              >
                Delete
              </button>
            )}
          </span>
        )}
      </li>
    );
  }
}

const Messages = withFirebase(MessagesBase);

const condition = authUser => !!authUser;

export default compose(
  withEmailVerification,
  withAuthorization(condition)
)(HomePage);

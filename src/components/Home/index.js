import React, { Component, useState, useEffect } from 'react';

import { compose } from 'recompose';
import { AuthUserContext, withAuthorization } from '../Session';
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

const MessagesBase = props => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    props.firebase
      .messages()
      .orderByChild('createdAt')
      .limitToLast(limit)
      .on('value', snapshot => {
        const messageObject = snapshot.val();
        if (messageObject) {
          const messageList = Object.keys(messageObject).map(key => ({
            ...messageObject[key],
            uid: key
          }));

          // convert messages list from snapshot
          setMessages(messageList.reverse());
          setLoading(false);
        } else {
          setMessages(null);
          setLoading(false);
        }
      });

    return () => {
      props.firebase.messages().off();
    };
  }, [limit, props.firebase]);

  const onChangeText = event => {
    setText(event.target.value);
  };

  const onNextPage = () => {
    setLimit(limit + 5);
  };

  const onCreateMessage = (event, authUser) => {
    props.firebase.messages().push({
      text: text,
      userId: authUser.uid,
      createdAt: props.firebase.serverValue.TIMESTAMP
    });

    setText('');

    event.preventDefault();
  };

  const onRemoveMessage = uid => {
    props.firebase.message(uid).remove();
  };

  const onEditMessage = (message, text) => {
    const { uid, ...messageSnapshot } = message;
    props.firebase.message(message.uid).set({
      ...messageSnapshot,
      text,
      editedAt: props.firebase.serverValue.TIMESTAMP
    });
  };

  return (
    <AuthUserContext.Consumer>
      {authUser => (
        <div>
          {!loading && messages && (
            <button type='button' onClick={onNextPage}>
              More
            </button>
          )}

          {loading && <div>Loading ...</div>}

          {messages ? (
            <MessageList
              authUser={authUser}
              messages={messages}
              onRemoveMessage={onRemoveMessage}
              onEditMessage={onEditMessage}
            />
          ) : (
            <div>There are no messages ...</div>
          )}

          <form onSubmit={event => onCreateMessage(event, authUser)}>
            <input type='text' value={text} onChange={onChangeText} />
            <button type='submit'>Send</button>
          </form>
        </div>
      )}
    </AuthUserContext.Consumer>
  );
};

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

export default compose(withAuthorization(condition))(HomePage);

import React from 'react';
import { AssistantAPI } from './lib/assistant';
import "./main.scss";

const assistant = new AssistantAPI();

const Main = () => {
	const [messages, setMessages] = React.useState<any[] | null>(null);
	const [inputMessage, setInputMessage] = React.useState<string>("");
	const [threadId, setThreadId] = React.useState<string>();

	const init = () => {
		if(!threadId) assistant.startNewThread().then(setThreadId);
		else setTimeout(init, 1500);
	}

	React.useEffect(init, []);

	const handleInputMessageChange = (e: React.FormEvent<HTMLInputElement>) => {
		setInputMessage(e.currentTarget.value);
		e.preventDefault();
	}

	const sendMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
		if(threadId) {
			assistant.addMessage(threadId, inputMessage).then(() => {
				assistant.getMessages(threadId).then(messages => {
					setMessages(messages);
				});

				assistant.runThread(threadId).then(runId => {
					const waitResolve = async (): Promise<boolean> => {
						return (async () =>  await assistant.getRunStatus(threadId, runId))()
						.then(async (status) => {
							return ["queued", "in_progress"].indexOf(status) !== -1 ?
								await (async (data?) =>
									new Promise((resolve) => setTimeout(() => resolve(data), 1500)).then(waitResolve))()
								: true
						})
					}

					waitResolve().then(() => {
						assistant.getMessages(threadId).then(messages => {
							setMessages(messages);
						});
					});
				});
				setInputMessage("");
			});
		}
		e.preventDefault();
	}

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp * 1000);
		const hours = date.getHours();
		const minutes = date.getMinutes();
		return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
	}

	return (
		<div id="app">
			{threadId && <header id="app-header">{threadId}</header>}
			<div id="messages">
				{messages?.map(message => 
					<div key={message.id} className={`message message-${message.role}`}>
						<span className="message-body">{message.body}</span>
						<span className="message-time">{formatDate(message.created_at)}</span>
					</div>
				)}
			</div>
			<form id="app-form">
				<input type="text" value={inputMessage} onChange={handleInputMessageChange} />
				<button type="submit" onClick={sendMessage}>Enviar</button>
			</form>
		</div>
	);
}

export default Main;

import React from 'react';
import { PizzaAssistant } from "./lib/pizzaAssistant"
import { SalesBrokerAssistant } from './lib/salesBrokerAssistant';
import { CreditAssistant } from './lib/creditAssistant';
import "./main.scss";

/*new SalesBrokerAssistant("bofa", "Bank of America");*/
/*new PizzaAssistant("pizza-assistant", "Pizzaria do Marcus", { items: [{ name: "Pizza de Muzzarela", price: 30, },{ name: "Pizza de Calabresa", price: 38, },{ name: "Coca-cola", price: 12, }] });*/
const assistant = new CreditAssistant("super-sim", "SuperSim");

const Main = () => {
	const [messages, setMessages] = React.useState<any[] | null>(null);
	const [inputMessage, setInputMessage] = React.useState<string>("");
	const [threadId, setThreadId] = React.useState<string>();

	const init = () => {
		if(assistant.ready) assistant.startNewThread().then(thread => { setThreadId(thread?.id) });
		else setTimeout(init, 500);
	}

	React.useEffect(init, []);

	const handleInputMessageChange = (e: React.FormEvent<HTMLInputElement>) => {
		setInputMessage(e.currentTarget.value);
		e.preventDefault();
	}

	const sendMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
		if(threadId) {
			assistant.addMessage(threadId, inputMessage).then(message => {
				assistant.getMessages(threadId).then(messages => {
					setMessages(messages);
				});

				assistant.runThread(threadId).then(run => {
					assistant.getMessages(threadId).then(messages => {
						setMessages(messages);
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
						<span className="message-body">{message.content[0].text.value}</span>
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

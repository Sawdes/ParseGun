export class User {
    TelegramId: number;
    firstName: string;
    lastName: string;
    username: string;
    context: string | null;

    constructor(sender: { id: number; firstName: string; lastName: string; username: string; }) {
        this.TelegramId = Number(sender.id),
        this.firstName = sender.firstName,
        this.lastName = sender.lastName,
        this.username = sender.username
        this.context = null
    }
}  
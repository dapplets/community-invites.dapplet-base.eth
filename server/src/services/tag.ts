import { execute } from '../connection';
import { Profile } from '../types';
import * as userService from './user';

export type Tag = {
    id: string;
    name: string;
}

export async function getTags(): Promise<Tag[]> {
    const query = 'SELECT * FROM tags;';
    return execute(c => c.query(query).then(r => r.rows));
}

export async function tag(item_id: string, tag_id: string, user: Profile): Promise<void> {
    return _makeItemTag(item_id, tag_id, user, true);
}

export async function untag(item_id: string, tag_id: string, user: Profile): Promise<void> {
    return _makeItemTag(item_id, tag_id, user, false);
}

async function _makeItemTag(item_id: string, tag_id: string, user: Profile, value: boolean): Promise<void> {
    return execute(async (client) => {
        if (!await userService.getUser(user.namespace, user.username)) {
            await userService.createUser(user);
        }

        // existance checking
        const isExist = await (async () => {
            const values = [item_id, tag_id, user.namespace, user.username]
            const query = `
                SELECT * 
                FROM itemtags
                WHERE item_id = $1
                    AND tag_id = $2
                    AND namespace = $3
                    AND username = $4
            `;

            const result = await client.query(query, values);
            return result.rowCount > 0;
        })();

        const values = [item_id, tag_id, user.namespace, user.username, value];
        const query = (isExist) ? `
            UPDATE itemtags
            SET value = $5
            WHERE item_id = $1
                AND tag_id = $2
                AND namespace = $3
                AND username = $4
        ` : `
            INSERT INTO itemtags(item_id, tag_id, namespace, username, value) 
            VALUES ($1, $2, $3, $4, $5);
        `;

        await client.query(query, values);
    });
}
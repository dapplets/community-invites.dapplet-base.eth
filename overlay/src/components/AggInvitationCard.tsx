import React from 'react';
import { Icon, Segment, Image, Label, Header, Comment, Button, Dropdown } from 'semantic-ui-react';
import { MyInvitation, PostWithInvitations, Tag } from '../api';
import { Profile } from '../dappletBus';
import Twemoji from 'react-twemoji';

interface IProps {
    post: PostWithInvitations;
    profile: Profile;
    //onClose: () => void;
    //onClick: () => void;
    onEdit?: () => void;
    highlight?: boolean;
    disabled?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onUserClick?: (c: {
        id: number;
        name: string;
        short_name: string
    }, u: {
        namespace: string;
        username: string;
        fullname: string;
        is_private: boolean;
        is_from_me: boolean;
    }) => void;
    tags: {
        id: string;
        name: string;
        value: boolean;
    }[];
    availableTags: Tag[];
    onTag: (item_id: string, tag_id: string) => void;
    onUntag: (item_id: string, tag_id: string) => void;
    onTagFilter: (tag: {
        id: string;
        name: string;
        value: boolean;
    }) => void;
    loading: { [key: string]: boolean };
    tagging: boolean;
}

interface IState { }

export class AggInvitationCard extends React.Component<IProps, IState> {
    render() {
        const p = this.props;

        return <Segment
            className="invitation-card" // for hover
            disabled={p.disabled ?? false}
            style={(p.highlight) ? { boxShadow: '0 1px 2px 0 #2185d05e', borderColor: '#2185d0', cursor: 'default' } : { cursor: 'default' }}
            //onClick={() => p.onClick()} 
            onMouseEnter={p.onMouseEnter}
            onMouseLeave={p.onMouseLeave}
        >
            <Comment.Group minimal>
                <Comment >
                    <Comment.Avatar style={{ margin: 0 }} src={p.post.post.img} />
                    <Comment.Content style={{ marginLeft: '3.3em', padding: 0, display: 'flex' }} >
                        <div style={{ flex: '1' }}>
                            <Comment.Author><Twemoji>{p.post.post.fullname}</Twemoji></Comment.Author>
                            <Comment.Metadata style={{ margin: '0' }}>@{p.post.post.username}</Comment.Metadata>
                        </div>
                        <div>
                            {(p.highlight && p.onEdit !== undefined) ? <Button primary onClick={(e) => (e.stopPropagation(), p.onEdit!())} size='mini'>Edit Invites</Button> : null}
                        </div>
                    </Comment.Content>
                    <Comment.Text style={{ margin: '0.5em 0 0.5em 47px' }}>{p.post.post.text} <Button icon='external' title='Open the post in Twitter' basic size='mini' style={{ boxShadow: 'none', padding: '2px', margin: '0', position: 'relative', top: '-1px' }} onClick={(e) => (e.stopPropagation(), window.open(`https://twitter.com/${p.post.post.username}/status/${p.post.post.id}`, '_blank'))} /></Comment.Text>
                    <div>
                        {p.post.conferences.map(c => {
                            const exceptMe = c.users.filter(u => !(u.username === p.profile?.username && u.namespace === p.profile?.namespace));
                            const isMe = !!c.users.find(u => u.username === p.profile?.username && u.namespace === p.profile?.namespace);
                            const public_users = exceptMe.filter(x => x.is_private === false);
                            const private_users = exceptMe.filter(x => x.is_private === true);

                            return <div key={c.id} style={{ paddingBottom: '4px' }}>
                                <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '20ch', display: 'block', float: 'left' }} title={c.name}>{c.name}</b><b>: </b>
                                {(isMe) ? 'me' : null}
                                {(isMe && (public_users.length > 0 || private_users.length > 0)) ? ', ' : null}

                                {public_users.map((u, i) => <React.Fragment key={i}>
                                    {(u.is_from_me === true) ? <span title={`Edit invite for ${u.fullname} to ${c.name}`}>{(i !== 0) ? ', ' : ''}
                                        <span onClick={() => p.onUserClick?.(c, u)} style={{ textDecoration: 'underline', color: '#2185d0', cursor: 'pointer' }}>@{u.username}</span>
                                    </span> : <span title={u.fullname}>{(i !== 0) ? ', ' : ''}
                                            <span>@{u.username}</span>
                                        </span>}
                                </React.Fragment>)}

                                {(private_users.length > 0) ? <React.Fragment> and {private_users.length} private person{(private_users.length > 1 ? 's' : '')}</React.Fragment> : null}
                                <br />
                            </div>
                        })}
                    </div>

                    {(p.tagging) ? <div style={{ marginTop: '4px' }}>

                        {p.tags.filter(x => x.value === true)
                            .map(x => {

                                const isTagLoading = p.loading[`${p.post.post.id}/untag/${x.id}`];

                                return <Label
                                    onClick={(!isTagLoading) ? () => this.props.onTagFilter(x) : undefined}
                                    style={{ marginTop: '.14285714em' }}
                                    as={(!isTagLoading) ? 'a' : undefined}
                                    color={(!isTagLoading) ? 'green' : undefined}
                                    key={x.id}
                                >
                                    {x.name}
                                    <Icon
                                        name='delete'
                                        disabled={isTagLoading}
                                        link
                                        onClick={(e: any) => (e.stopPropagation(), this.props.onUntag(p.post.post.id, x.id))}
                                    />
                                </Label>
                            })}

                        {(p.availableTags.filter(x => !p.tags.find(y => y.id === x.id && y.value === true)).length > 0) ? <Dropdown
                            trigger={
                                <Label
                                    style={{ marginTop: '.14285714em' }}
                                    color='blue'
                                    disabled={p.loading[`${p.post.post.id}/tag`]}
                                >
                                    <Icon name='plus' />Add tag</Label>
                            }
                            pointing='top right'
                            icon={null}
                            disabled={p.loading[`${p.post.post.id}/tag`]}
                        >
                            <Dropdown.Menu>
                                {p.availableTags.filter(x => !p.tags.find(y => y.id === x.id && y.value === true))
                                    .map(x =>
                                        <Dropdown.Item
                                            key={x.id}
                                            onClick={() => this.props.onTag(p.post.post.id, x.id)}
                                        >{x.name}</Dropdown.Item>
                                    )}
                            </Dropdown.Menu>
                        </Dropdown> : null}

                    </div> : null}
                </Comment>
            </Comment.Group>
        </Segment>
    }
}

import React from 'react';
import { Card, Segment, Image, Comment } from 'semantic-ui-react';
import { Profile } from '../dappletBus';

interface IProps {
    profile: Profile;
    card?: boolean;
    badge?: any;
    onBadgeClick?: Function;
}

interface IState { }

export class ProfileCard extends React.Component<IProps, IState> {
    render() {
        const p = this.props.profile;
        if (this.props.card) return (<Card fluid>
            <Card.Content>
                <Image
                    floated='left'
                    size='mini'
                    style={{ borderRadius: 34, marginBottom: 0 }}
                    src={p.img}
                />
                <Card.Header style={{ fontSize: '1.15em'}}>{p.fullname} {this.props.badge ?? null}</Card.Header>
                <Card.Meta>@{p.username}</Card.Meta>
            </Card.Content>
        </Card>);
        else return (<Segment>
            <Comment.Group>
                <Comment>
                    <Comment.Avatar src={p.img} />
                    <Comment.Content>
                        <Comment.Author as='a'>{p.fullname}</Comment.Author>
                        <Comment.Metadata>
                            <div>@{p.username}</div>
                        </Comment.Metadata>
                    </Comment.Content>
                </Comment>
            </Comment.Group>
        </Segment>);
    }
}

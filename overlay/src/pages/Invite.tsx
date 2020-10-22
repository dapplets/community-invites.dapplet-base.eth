import React from 'react';
import { Button, Divider, Accordion, Icon, Container, Grid, Loader, Dropdown, Segment, Checkbox, Placeholder, Breadcrumb } from 'semantic-ui-react';
import { Post, Profile, Settings } from '../dappletBus';
import { PostCard } from '../components/PostCard';
import { Api, Conference, ConferenceWithInvitations, MyInvitation } from '../api';
import { ProfileCard } from '../components/ProfileCard'
import { HoverButton } from '../components/HoverButton';
import Linkify from 'react-linkify';
import { AllInvites } from './AllInvites';
import { NewInvite } from './NewInvite';

enum Tabs {
  No,
  AllInvites,
  NewInvite,
  EditInvite
}

interface IProps {
  post?: Post;
  profile: Profile;
  settings: Settings;
  onPostsClick: (conferenceShortName: string, username: string) => void;
}

interface IState {
  isNewInviteOpened: boolean;
  invited: boolean;
  data: MyInvitation[];
  loading: boolean;
  currentTab: Tabs;
  highlightedInvitationId: number;
}

export class Invite extends React.Component<IProps, IState> {
  private _api: Api;

  constructor(props: IProps) {
    super(props);
    this._api = new Api(this.props.settings.serverUrl);
    this.state = {
      isNewInviteOpened: true,
      invited: false,
      data: [],
      loading: true,
      currentTab: Tabs.No,
      highlightedInvitationId: -1
    }
  }

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    const p = this.props;
    const s = this.state;

    this.setState({ loading: true });
    
    const data = await this._api.getMyInvitations(this.props.profile.namespace, this.props.profile.username);
    const invitation = p.post ? data.find(x => x.post_id === p.post!.id) : null;

    this.setState({ data, loading: false, currentTab: (!p.post || !!invitation) ? Tabs.AllInvites : Tabs.NewInvite, highlightedInvitationId: invitation?.id ?? -1 });
  }

  async setInvited() {
    this.setState({ invited: true });
    await this.loadData();
  }

  async withdraw(invitation: MyInvitation) {
    this.setState({ data: this.state.data.filter(x => x !== invitation) });
    const profileTo = {
      username: invitation.author_username.toLowerCase(),
      fullname: invitation.author_fullname,
      img: invitation.author_img,
      namespace: 'twitter.com'
    };
    const post: Post = {
      authorFullname: profileTo.fullname,
      authorUsername: profileTo.username,
      authorImg: profileTo.img,
      id: invitation.post_id,
      text: invitation.post_text
    }
    await this._api.withdraw(this.props.profile!, profileTo, invitation.conference_id, post);
  }

  render() {
    const p = this.props,
      s = this.state;

    if (s.loading) return <Placeholder>
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder>;

    return <React.Fragment>

      <Breadcrumb size='large'>
        <Breadcrumb.Section
          active={s.currentTab === Tabs.AllInvites}
          onClick={(s.currentTab !== Tabs.AllInvites) ? () => this.setState({ currentTab: Tabs.AllInvites }) : undefined}
        >All Invites</Breadcrumb.Section>

        {(s.currentTab !== Tabs.AllInvites) ? <React.Fragment>
          <Breadcrumb.Divider />
          <Breadcrumb.Section active>New Invite</Breadcrumb.Section>
        </React.Fragment> : null}

      </Breadcrumb>

      {(s.currentTab === Tabs.AllInvites) ? <AllInvites highlightedInvitationId={s.highlightedInvitationId} loading={s.loading} settings={p.settings} profile={p.profile} data={s.data} onWithdraw={(x) => this.withdraw(x)} /> : null}
      {(s.currentTab === Tabs.NewInvite) ? <NewInvite loading={s.loading} settings={p.settings} profile={p.profile} post={p.post!} onInvited={() => (this.setState({ currentTab: Tabs.AllInvites }), this.loadData())} onCancel={() => this.setState({ currentTab: Tabs.AllInvites })} /> : null}

    </React.Fragment>
  }
}
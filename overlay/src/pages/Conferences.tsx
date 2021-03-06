import React from 'react';
import { Button, Accordion, Icon, Container, Grid, Loader, Modal, Header } from 'semantic-ui-react';
import { Profile, Settings } from '../dappletBus';
import { Api, Conference, ConferenceWithInvitations } from '../api';
import { ProfileCard } from '../components/ProfileCard'
import Linkify from 'react-linkify';
import { HoverButton } from '../components/HoverButton';

interface IProps {
  profile?: Profile;
  settings: Settings;
  onPostsClick: (conferenceShortName: string, username: string) => void;
}

interface IState {
  data: ConferenceWithInvitations[];
  activeIndex: string | null;
  attended: number[];
  invited: number[];
  loading: { [key: string]: boolean };
  selectedConference: number | null;
  absending: number | null;
}

export class Conferences extends React.Component<IProps, IState> {
  private _api: Api;

  constructor(props: IProps) {
    super(props);

    this._api = new Api(this.props.settings.serverUrl);
    this.state = {
      data: [],
      activeIndex: null,
      attended: [],
      invited: [],
      loading: {
        'list': true
      },
      selectedConference: null,
      absending: null
    }
  }

  async componentDidMount() {
    try {
      await this._loadConferences();
      this._setLoading('list', false);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }


  async _loadConferences() {
    const data = await this._api.getConferencesWithInvitations(this.props.profile!, undefined);
    this.setState({ data });
  }

  async componentWillUnmount() {
    this._api.controller.abort();
  }

  accordionClickHandler = (e: any, titleProps: any) => {
    const { index } = titleProps
    const { activeIndex } = this.state
    const newIndex = activeIndex === index ? null : index

    this.setState({ activeIndex: newIndex })
  }

  attendButtonClickHandler = async (e: any, titleProps: any) => {
    e?.stopPropagation();
    this.setState({ absending: null });

    const { index } = titleProps;
    this._setLoading('attend-' + index, true);
    this.setState({ selectedConference: index });
    try {
      if (this.state.data.find((d) => d.conference.id === index)!.attendance_from) {
        await this._api.absend(this.props.profile!, index);
      } else {
        await this._api.attend(this.props.profile!, index);
      }

      await this._loadConferences();
    } catch (err) {
      console.error(err);
    } finally {
      this._setLoading('attend-' + index, false);
      setTimeout(() => this.setState({ selectedConference: null }), 2000);
    }
  }

  _setLoading(key: string, value: boolean) {
    const loading = this.state.loading;
    loading[key] = value;
    this.setState({ loading });
  }

  _getLoading(key: string) {
    return this.state.loading[key] || false;
  }

  renderAccordion = (data: ConferenceWithInvitations[], header: any, key: string) => {
    if (data.length === 0) return null;
    const { activeIndex } = this.state;

    const isAttended = (c: Conference) => {
      return this.state.data.find(d => d.conference.id === c.id)!.attendance_from;
    }

    const absendingInvitations = this.state.absending ? this.state.data.find(x => x.conference.id === this.state.absending)!.invitations.filter(x => x.from.username === this.props.profile?.username && x.from.namespace === this.props.profile?.namespace) : [];

    return (<React.Fragment>
      {header && data.length > 0 ? header : null}
      <Accordion fluid styled>
        {data.map(d => d.conference).map(c => <React.Fragment key={c.id}>
          <Accordion.Title active={activeIndex === key + c.id} index={key + c.id} onClick={this.accordionClickHandler} style={{ display: 'flex', color: (this.state.selectedConference === c.id) ? '#2185d0' : undefined }} >
            <Icon name='dropdown' style={{ position: 'relative', top: '8px' }} />
            <div style={{ margin: '0 auto 0 0', maxWidth: '250px', padding: '7px 0 0 0', lineHeight: '1.4em' }}>{c.name}</div>

            {isAttended(c) ? (
              (this.state.data.find(x => x.conference.id === c.id)!.invitations.filter(x => x.from.username === this.props.profile?.username && x.from.namespace === this.props.profile?.namespace).length > 0) ?
                <Modal
                  closeIcon
                  open={c.id === this.state.absending}
                  trigger={
                    <HoverButton
                      hoverColor='red'
                      hoverText='Cancel'
                      index={c.id}
                      style={{ width: '75px', paddingLeft: '0', paddingRight: '0', height: '30px' }}
                      loading={this._getLoading('attend-' + c.id)}
                      disabled={this._getLoading('attend-' + c.id)}
                      color='green'
                      size='mini'
                    >Attending</HoverButton>
                  }
                  onClose={() => this.setState({ absending: null })}
                  onOpen={() => this.setState({ absending: c.id })}
                  dimmer='inverted'
                >
                  <React.Fragment>
                    <Header content='Cancel your Attendance?' />
                    <Modal.Content>
                      <div>
                        All you not going to attend the conference any more?<br />
                        All of your {absendingInvitations.length} invites to this conference will be revoked.
                      </div>
                      {(this.state.absending) ? this.renderParticipants(this.state.absending, true) : null}
                    </Modal.Content>
                    <Modal.Actions>
                      <Button color='red' onClick={() => this.setState({ absending: null })}>
                        <Icon name='remove' /> No
                      </Button>
                      <Button color='green' onClick={() => this.attendButtonClickHandler(null, { index: this.state.absending })}>
                        <Icon name='checkmark' /> Yes
                      </Button>
                    </Modal.Actions>
                  </React.Fragment>
                </Modal> : <HoverButton
                  hoverColor='red'
                  hoverText='Cancel'
                  index={c.id}
                  style={{ width: '75px', paddingLeft: '0', paddingRight: '0', height: '30px' }}
                  loading={this._getLoading('attend-' + c.id)}
                  disabled={this._getLoading('attend-' + c.id)}
                  color='green'
                  size='mini'
                  onClick={this.attendButtonClickHandler}
                >Attending</HoverButton>

            ) : <Button
              basic
              index={c.id}
              style={{ width: '75px', paddingLeft: '0', paddingRight: '0', height: '30px' }}
              loading={this._getLoading('attend-' + c.id)}
              disabled={this._getLoading('attend-' + c.id)}
              color='blue'
              size='mini'
              onClick={this.attendButtonClickHandler}
              className="hoverable"
            >Attend</Button>}


          </Accordion.Title>
          <Accordion.Content active={activeIndex === key + c.id}>
            <p>
              {(c.description) ? <React.Fragment><Linkify componentDecorator={(href: string, text: string, key: string) => <a href={href} key={key} target="_blank" rel="noopener noreferrer">{text}</a>}>{c.description}</Linkify><br /></React.Fragment> : null}
              {c.date_from.toLocaleDateString() + ' - ' + c.date_to.toLocaleDateString()}<br />
              <a href={c.website}>{c.website}</a>
            </p>
            {this.renderParticipants(c.id)}
          </Accordion.Content>
        </React.Fragment>)}
      </Accordion>
    </React.Fragment>);
  }

  renderParticipants(conferenceId: number, forModal: boolean = false) {
    const conference = this.state.data.find(x => x.conference.id === conferenceId)!.conference;
    const invitations = this.state.data.find(x => x.conference.id === conferenceId)!.invitations;
    const wantsMe = invitations.filter(x => x.to.username === this.props.profile?.username).map(x => ({
      username: x.from.username,
      fullname: x.from.fullname,
      isWant: false,
      isWantsMe: true
    }));
    const isWant = invitations.filter(x => x.from.username === this.props.profile?.username).map(x => ({
      username: x.to.username,
      fullname: x.to.fullname,
      isWant: true,
      isWantsMe: false
    }));

    const data: any[] = [];

    for (const row of [...wantsMe, ...isWant]) {
      const found = data.find(x => x.username.toLowerCase() === row.username.toLowerCase());
      if (found) {
        found.count = found.count + 1;
        found.isWant = found.isWant || row.isWant;
        found.isWantsMe = found.isWantsMe || row.isWantsMe;
      } else {
        data.push({ ...row, count: 1 });
      }
    }

    if (data.length === 0) return null;

    return (
      <Grid columns='equal' style={{ marginTop: '1em', marginBottom: '0' }}>
        {data.filter(x => (forModal) ? x.isWant === true : true).map((r, i) => <Grid.Row style={{ padding: 0 }} key={i}>
          <Grid.Column width={1}>
            {this.getIcon(r)}
          </Grid.Column>
          <Grid.Column >
            {r.fullname} @{r.username} {(forModal) ?
              <span>by {r.count} topic{(r.count > 1) ? 's' : ''}</span> :
              <a style={{ cursor: 'pointer' }} onClick={() => this.props.onPostsClick?.(conference.short_name, r.username)}>by {r.count} topic{(r.count > 1) ? 's' : ''}</a>}
          </Grid.Column>
        </Grid.Row>)}
      </Grid>);
  }

  getIcon(r: any) {
    if (r.isWant && r.isWantsMe) {
      return <Icon name='handshake outline' title={`You and ${r.fullname} are invited each other`} />
    } else if (r.isWant) {
      return <Icon name='hand paper outline' title={`You invited ${r.fullname}`} rotated='clockwise' style={{ position: 'relative', left: '3px' }} />
    } else if (r.isWantsMe) {
      return <Icon name='hand paper outline' title={`${r.fullname} invited you`} style={{ transform: 'scale(-1, 1) rotate(90deg)', position: 'relative', left: '-1px' }} />
    } else {
      return null;
    }
  }

  render() {
    if (!this.props.profile) {
      return <Container text style={{ textAlign: 'center' }}>
        Please login to Twitter to continue
      </Container>;
    }

    return (
      <div>
        <ProfileCard card profile={this.props.profile} />
        {(!this._getLoading('list') ? this.renderAccordion(this.state.data, null, 'all') : <Loader active inline='centered'>Loading</Loader>)}
      </div>
    );
  }
}

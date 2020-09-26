import React from 'react';
import {Grid} from 'semantic-ui-react';
import './App.css';
import ColorPanel from './ColorPanel/ColorPanel';
import SidePanel from './SidePanel/SidePanel';
import Messages from './Messages/Messages';
import MetaPanel from './MetaPanel/MetaPanel';
import {connect} from 'react-redux';



const App = (props)=>(
  <Grid 
    columns="equal" 
    className="app" 
    style={{background:props.secondary}}
  >
    <ColorPanel 
      user={props.user} 
      key={props.channel && 
      props.channel.name} 
    />
    <SidePanel 
      key={props.user && props.user.uid}
      user={props.user} 
      primary={props.primary} />
    <Grid.Column style={{marginLeft:320}}>
      <Messages 
        key={props.channel && props.channel.id}
        channel={props.channel} 
        user={props.user} 
        isPrivateChannel={props.isPrivateChannel}
      />
    </Grid.Column>
    <Grid.Column width={4}>
      <MetaPanel  
        channel={props.channel}
        userPosts={props.userPosts}
        isPrivateChannel={props.isPrivateChannel}  
        key={props.channel && props.channel.name} />
    </Grid.Column>
  </Grid>
)

const mapStateToProps = state =>({
    user:state.user.currentUser,
    channel:state.channel.currentChannel,
    isPrivateChannel:state.channel.isPrivateChannel,
    userPosts:state.channel.userPosts,
    primary:state.color.primary,
    secondary:state.color.secondary
});

export default connect(mapStateToProps)(App);

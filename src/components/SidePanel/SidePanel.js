import React from 'react';
import {Menu} from 'semantic-ui-react';
import UserPanel from './UserPanel';
import Channels from './Channels';
import DirectMessages from './DirectMessages'
import Starred from './Starred'

class SidePanel extends React.Component{

    render(){
        const {primary,user} =this.props
        return(
            <Menu
                size="large" inverted fixed="left" vertical 
                style={{background:primary,fontSize:'1.2rem'}}
            >
                <UserPanel primary={primary} user={user} />
                <Starred user={user} />
                <Channels user={user} />
                <DirectMessages user={user} />
            </Menu>
        )
    }
}


export default SidePanel;  
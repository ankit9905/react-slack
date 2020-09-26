import React from 'react'
import {Header,Segment,Input,Icon} from 'semantic-ui-react';

class MessagesHeader extends React.Component{

    render(){
        const {channelName,numUniqueUsers,handleSearchChange,searchLoading,isPrivateChannel,
                isChannelStarred,handleStar} = this.props;
        
        return(
            <Segment clearing>
                {/* {Channel Title} */}
                <Header fluid="true" as="h2" floated="left" style={{marginBottom:0}}>
                    <span>
                         {channelName}
                        { !isPrivateChannel && (
                            <Icon 
                                onClick={handleStar} 
                                name={isChannelStarred ? 'star' :'star outline'} 
                                color={isChannelStarred ? 'yellow' : 'black'}
                            />
                        )}
                    </span>
                    <Header.Subheader>{numUniqueUsers} </Header.Subheader>
                </Header>
                {/* Channel Search Input */}
                <Header floated="right">
                    <Input size="mini" icon="search" onChange={handleSearchChange}
                    name="searchTerm" placeholder="Search Messages" loading={searchLoading} />
                </Header>
            </Segment>
        )
    }
}

export default MessagesHeader;
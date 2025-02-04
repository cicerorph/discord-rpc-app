// Name -> MubiLop
// ID -> mubilopdiscordrpc
// Description -> Discord RPC extension (uses app)
// License -> MIT

(function(Scratch) {
    'use strict';
    
    const icon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3MiA1NSI+PHBhdGggZD0iTTYxLjggMEgxMC4yQzQuNiAwIDAgNC42IDAgMTAuMnYzNC42QzAgNTAuNCA0LjYgNTUgMTAuMiA1NWg0MS4zTDQ5LjYgNDlsLTMuNy0zLjQgMi0xLjggMy41LTMuMmwtMS4yLTIuOSAxMS42LTExLjVWMTAuMkM2MS44IDQuNiA1Ny4yIDAgNTEuNiAwek0zOS43IDM5LjZzLTEuMS0xLjMtMi0yLjQgMi40LS43IDIuNC0uNy0xNS42LTcuNy0xNS42LTcuNyAxNS42IDcuNyAxNS42IDcuN2wtMi40LS43IDItMi40LTIwLTEwLjIgMjAgMTAuMi0yIDIuNCAyLjQuNy0xNS42LTcuNyAxNS42IDcuN3MtMi40LS43LTIuNC0uN2wyIDIuNC0xMC4yIDIwIDEwLjItMjB6IiBmaWxsPSIjNzI4OURBIi8+PC9zdmc+';
    
    class DiscordRPCExtension {
      constructor() {
        this.isConnected = false;
      }
  
      getInfo() {
        return {
          id: 'mubilopdiscordrpc',
          name: 'Discord RPC',
          color1: '#7289DA',
          color2: '#4E5D94',
          color3: '#2C2F33',
          menuIconURI: icon,
          blockIconURI: icon,
          blocks: [
            {
              opcode: 'setClientId',
              blockType: Scratch.BlockType.COMMAND,
              text: 'set Discord Client ID to [ID]',
              arguments: {
                ID: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: '123456789'
                }
              }
            },
            {
              opcode: 'setPresence',
              blockType: Scratch.BlockType.COMMAND,
              text: 'set Discord status details: [DETAILS] state: [STATE]',
              arguments: {
                DETAILS: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: 'Playing my game'
                },
                STATE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: 'In level 1'
                }
              }
            },
            {
              opcode: 'setPresenceWithImage',
              blockType: Scratch.BlockType.COMMAND,
              text: 'set Discord status details: [DETAILS] state: [STATE] image: [IMAGE] image text: [IMAGETEXT]',
              arguments: {
                DETAILS: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: 'Playing my game'
                },
                STATE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: 'In level 1'
                },
                IMAGE: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: 'game_icon'
                },
                IMAGETEXT: {
                  type: Scratch.ArgumentType.STRING,
                  defaultValue: 'My Cool Game'
                }
              }
            },
            {
              opcode: 'isConnected',
              blockType: Scratch.BlockType.BOOLEAN,
              text: 'is connected to Discord?'
            }
          ]
        };
      }
  
      async setClientId(args) {
        try {
          const response = await fetch('http://localhost:51789/set-client-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              clientId: args.ID
            })
          });
          const data = await response.json();
          this.isConnected = data.success;
          return data.success;
        } catch (error) {
          this.isConnected = false;
          return false;
        }
      }
  
      async setPresence(args) {
        try {
          const response = await fetch('http://localhost:51789/update-presence', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              details: args.DETAILS,
              state: args.STATE,
              startTimestamp: Date.now()
            })
          });
          return (await response.json()).success;
        } catch (error) {
          return false;
        }
      }
  
      async setPresenceWithImage(args) {
        try {
          const response = await fetch('http://localhost:51789/update-presence', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              details: args.DETAILS,
              state: args.STATE,
              largeImageKey: args.IMAGE,
              largeImageText: args.IMAGETEXT,
              startTimestamp: Date.now()
            })
          });
          return (await response.json()).success;
        } catch (error) {
          return false;
        }
      }
  
      isConnected() {
        return this.isConnected;
      }
    }
  
    Scratch.extensions.register(new DiscordRPCExtension());
  })(Scratch);
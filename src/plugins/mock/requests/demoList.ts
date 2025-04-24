import type { AuthInfo } from '../../QuickPage-Builder-AI-core/src/types/global'
import type { SelfServiceData } from '../../QuickPage-Builder-AI-core/src/types/dnd'

const authInfo: AuthInfo = {
  token: '123456',
  expires: 1677721600000,
  userInfo: {
    userId: '1',
    userName: 'admin',
    roles: ['admin']
  }
}

const selfServiceData: SelfServiceData = {
  ...authInfo,
  dataList: [
    {
      id: 1,
      itemName: 'Bottomfiling',
      url: 'Bottomfiling'
    },
    {
      id: 2,
      itemName: 'SmallBoard',
      url: 'SmallBoard'
    },
    {
      id: 3,
      itemName: 'CommonFunctions',
      url: 'CommonFunctions'
    },
    {
      id: 4,
      itemName: 'LaunchTicket',
      url: 'LaunchTicket'
    },
    {
      id: 5,
      itemName: 'ProcessingWorkOrders',
      url: 'ProcessingWorkOrders'
    }
  ]
}

export default {
  'post|/self/item/getSelfServiceItemList': () => {
    return {
      ...selfServiceData
    }
  }
}

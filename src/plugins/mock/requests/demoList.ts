interface DemoItem {
    id: number;
    itemName: string;
    url: string;
  }
  

const demoList: DemoItem[] = [
    {
        id: 1,
        itemName: "Bottomfiling",
        url: "Bottomfiling",
    },
    {
        id: 2,
        itemName: "SmallBoard",
        url: "SmallBoard",
    },
]

export default {
    'post|/self/item/getSelfServiceItemList': () => {
        return {
            status: 200,
            message: 'success',
            dataList: demoList,
          };
    }
}
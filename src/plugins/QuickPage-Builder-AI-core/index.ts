// 导入组件，组件必须声明 
import Test from './src/views/Index.vue';
import router from './src/router/index.ts';

import 'ant-design-vue/dist/reset.css';
import { Layout, Tree, Row, InputNumber, Button, Modal } from 'ant-design-vue';

export default {
    install: (app: any) => {
        // 使用路由
        app.use(router);
        
        // 使用组件
        app.use(Layout);
        app.use(Tree);
        app.use(Row);
        app.use(InputNumber);
        app.use(Button);
        app.use(Modal);

        app.component('Test', Test);
    },
};
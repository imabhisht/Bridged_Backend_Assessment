import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 100, // 100 virtual users
    duration: '30s', // Run for 30 seconds
};

export default function () {
    http.get('http://localhost:3005/mycode');
    sleep(1);
}
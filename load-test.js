import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let options = {
    stages: [
        { duration: '1m', target: 5 },   // Ramp up to 5 users over 1 minute
        { duration: '2m', target: 10 },  // Stay at 10 users for 2 minutes
        { duration: '1m', target: 15 },  // Ramp up to 15 users over 1 minute
        { duration: '2m', target: 20 },  // Stay at 20 users for 2 minutes
        { duration: '1m', target: 0 },   // Ramp down to 0 users over 1 minute
    ],
    thresholds: {
        http_req_failed: ['rate<0.1'],      // Allow up to 10% of requests to fail
        http_req_duration: ['p(95)<60000'], // 95% of requests should be below 60s
    },
};

export default function () {
    const url = 'http://<Replace-with-Load-Balancer-DNS-Name>/generate';
    const payload = JSON.stringify({ prompt: 'Why is the Earth round in shape?' });
    const params = {
        headers: { 'Content-Type': 'application/json' },
        timeout: '90s',  // Increase timeout to 90 seconds
    };
    let res;

    // Retry logic with increased timeout
    for (let retries = 0; retries < 3; retries++) {
        res = http.post(url, payload, params);
        if (res.status === 200) {
            break;
        }
        sleep(3);  // Wait for 3 seconds before retrying
    }

    const isSuccess = check(res, {
        'status is 200': (r) => r.status === 200,
    });

    console.log(`Response time: ${res.timings.duration} ms, Status: ${res.status}`);

    sleep(3);  // Wait for 3 seconds before making the next request
}

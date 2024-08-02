# Scalable LLM Inference Service with Ollama, Stress Testing, and Autoscaling

In this assignment, I undertook a comprehensive **DevOps/MLOps** project starting with the creation of a Dockerfile utilizing Ollama as the base image and the moondream model. I then implemented an API wrapper using Flask to streamline the application's functionality. To ensure robust deployment, I deployed the application on AWS EKS (Elastic Kubernetes Service). Performance and reliability were tested through load testing with K6, meticulously recording key metrics such as CPU utilization and memory usage. To enhance scalability, I employed Horizontal Pod Autoscaling (HPA) in conjunction with the load tests, ensuring the application could handle varying levels of traffic efficiently. Finally, I established a GitHub Actions pipeline for continuous integration and continuous deployment (CI/CD), automating the entire process and ensuring seamless updates and maintenance of the application.

GitHub Repository for Ollama: https://github.com/ollama/ollama

Firstly, I read a few documentations along with various blogs on Ollama and deploying a Large Language Model (LLM) using Kubernetes. 
The documents I referred are listed below:

https://ollama.com/blog

https://www.freecodecamp.org/news/how-to-run-open-source-llms-locally-using-ollama/

https://github.com/ollama/ollama/blob/main/docs/api.md

https://medium.com/@1kg/ollama-what-is-ollama-9f73f3eafa8b

https://microsoft.github.io/autogen/docs/ecosystem/ollama/

https://medium.com/@vimalathithanswetha/ollama-unleash-the-power-of-large-language-models-on-your-local-machine-df8907e13580

https://docs.aws.amazon.com/

https://kubernetes.io/docs/home/

After reading various documentations and blogs, understanding the Ollama-API and locally executing the model on my system, I proceeded with the assignment execution.

## Task 1: Create Dockerfile and Flask API wrapper

I created a very simple API wrapper using Flask. Implemented the ollama.chat method for interacting with the moondream model. Next, I went on with the creation of Dockerfile using ollama as the base image. This is how my Dockerfile looked.

![image](https://github.com/user-attachments/assets/f0eaaf96-c7bd-4544-8007-3c93b3959050)

Next, I created an EC2 instance on AWS with the instance type as **t2.micro** for the purpose of testing the application and model deployment. Imported the entire code onto the instance and installed Docker. Commands to install Docker for Ubuntu: 
```
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```
```
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
```
#Verify Docker Installation
sudo docker run hello-world
```

Next, I had to grant ubuntu user the privelege to execute Docker commands:
```
sudo usermod -aG docker ubuntu
```

After importing the Dockerfile and app.py along with requirements.txt and start.sh, I used this command to build the Dockerfile into an image.
```
docker build -t ollama-app .
```
Here I encountered 2 issues:

❌ The command "ollama pull moondream" could not be executed because the ollama service had not yet started.

❌ The command specified through CMD i.e. "python app.py" because ollama image doesn't understand the command 'python'.

**Inference**: One inference I drew other than these issues specified is that if I pull the moondream model while building the Dockerfile itself, the size of the image would become too large because the model is approximately 1 GB in size and on top of that the size of the ollama base image is also around 900 MB. 

A large Docker image increases the time for building, transferring, and starting containers, leading to inefficiencies in deployment and resource usage. Additionally, it consumes more disk space and bandwidth, impacting performance and scalability.

✅ So, I decided to execute these commands specified below using a Bash script (start.sh).
```
ollama server &
ollama pull moondream
python app.py
```

This is how the updated Dockerfile looked like:

![image](https://github.com/user-attachments/assets/3387c502-bb03-4b37-8733-9c6b98f2b0f2)

After updating the Dockerfile, I once again executed the command to build the Dockerfile into an image. The Dockerfile was built successfully! To list the images, execute the command:
```
docker images
```

![image](https://github.com/user-attachments/assets/227e98d8-35dc-4ea7-8e08-a691d7fe3fb5)

The Docker image 'ollama' is built and has a size of **1.01 GB**. The next step is to create a container for this image and to do that execute the command:
```
docker run -d -p 5000:5000 ollama

#To see the active containers
docker ps
```

This command ensures that the container executes in the background mode using the '-d' flag and also for it to be accessible at port 5000. 

Now, we will be sending POST request using the curl command to the model with a prompt "Why is the sky blue?" With the container running, you can access the service via HTTP requests. For example, to generate text, use curl or any HTTP client to send a POST request:
```
curl -X POST http://<ec2-instance-ip-address>:5000/generate -H "Content-Type: application/json" -d '{"prompt": "Why is the sky blue?"}'
```

❌ Error: moondream runner process has terminated: exit status 0xc0000409 error loading model: unable to allocate backend buffer

The error exit status 0xc0000409 typically indicates a problem related to memory access or an issue with how the program allocates memory. Specifically, in the context of ollama setup, the error message unable to allocate backend buffer suggests that there is a failure in allocating memory buffers required by the backend process handling the model.

✅ To resolve this error, we need to allocate more memory to the EC2 instance for the model to function properly. Stop the instance and under Actions, go to Instance Settings -> Change Instance Type -> Change the instance type to **t2.medium** -> Start the Instance again.

Post starting the instance, make sure the container is up and running. Once again, execute the command:
```
curl -X POST http://<ec2-instance-ip-address>:5000/generate -H "Content-Type: application/json" -d '{"prompt": "Why is the sky blue?"}'
```

❌ Error: curl: (28) Failed to connect to 54.167.116.223 port 5000 after 132622 ms: Couldn't connect to server (Here, 54.167.116.223 is the EC2 Instance IP Address)

✅ This error is a result of port 5000 not being publicly accessible. To make it accessible, go to the EC2 Dashboard -> Instances -> Security -> Click on Security Groups -> Add port 5000 in the Inbound Rules from Anywhere IPv4 and click on Update.

![image](https://github.com/user-attachments/assets/e9fe2287-84ad-45a4-aefe-57ff836ea9b0)

Execute the curl request again and you'll see the output of the prompt "Why is the sky blue?"

![Screenshot 2024-07-12 210647](https://github.com/user-attachments/assets/c2de3605-ebb8-420d-897c-4130969fd592)

**Inference**: The model has been initialized successfully and is running on the server. The API server is up and running; requests are being processed without errors. Upon sending a prompt, the server responds with the expected output, confirming successful operation!


## Task 2: Deploy the Model using AWS Elastic Kubernetes Service (EKS)

The next step is to deploy the model using AWS Elastic Kubernetes Service. First of all, let's understand the benefits of using AWS EKS over other container orchestration tools:

### Benefits of AWS EKS

-**Managed Service**: AWS handles Kubernetes control plane management, including scaling, patching, and updating.  
-**High Availability**: EKS control plane is distributed across multiple Availability Zones (AZs) for fault tolerance.  
-**Seamless AWS Integration**: Integrates with AWS services like IAM, ELB, CloudWatch, and ECR.  
-**Auto-Scaling**: Supports Kubernetes Cluster Autoscaler and Horizontal Pod Autoscaler for dynamic scaling.  
-**IAM Integration**: Provides fine-grained access control for Kubernetes resources.  
-**Pay-as-You-Go**: Charges based on worker nodes and resources consumed, with AWS Savings Plans available for cost optimization.  

Before creating the EKS Cluster, first we need to push the image we created to the DockerHub account. Commands:
```
docker login

#Mention the username
username:
#Mention the password
password:

docker push <username>:ollama
```

Go to your DockerHub account to make sure the image is pushed successfully!

Write the YAML manifests i.e. deployment.yml and service.yml for the application. Mention the docker image that you just pushed inside the deployment.yml file.

![image](https://github.com/user-attachments/assets/f81a5768-1548-4ddb-99ec-b44634e3b9dc)

For service.yml, make sure to keep the type of the service as **Load Balancer** as we will be using Load Balancer created by the cluster to efficiently distribute incoming network traffic across multiple servers, ensuring high availability and reliability by preventing server overload. It also enhances application performance and security by managing traffic spikes and providing failover support.

![image](https://github.com/user-attachments/assets/7a4b0057-c91d-4b47-b145-56904de99dd8)

The next task is to create an EKS Cluster but there are certain prerequisites that must be fulfilled before actually creating the cluster. 

### Prerequisites

**kubectl** – A command line tool for working with Kubernetes clusters. For more information, see Installing or updating kubectl. Refer: https://kubernetes.io/docs/tasks/tools/

**eksctl** – A command line tool for working with EKS clusters that automates many individual tasks. For more information, see Installing or updating. Refer: https://docs.aws.amazon.com/emr/latest/EMR-on-EKS-DevelopmentGuide/setting-up-eksctl.html

**AWS CLI** – A command line tool for working with AWS services, including Amazon EKS. For more information, see Installing, updating, and uninstalling the AWS CLI in the AWS Command Line Interface User Guide. After installing the AWS CLI, we recommend that you also configure it. For more information, see Quick configuration with aws configure in the AWS Command Line Interface User Guide. Refer: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

After installing the above mentioned tools, let's proceed with creating the EKS Cluster.

**Command to create EKS Cluster:**
```
eksctl create cluster   --name ollama-cluster   --region us-east-1   --nodegroup-name linux-nodes   --node-type t2.medium   --nodes 4  --managed
```

This command creates a new Amazon EKS cluster named ollama-cluster in the us-east-1 region with a managed node group named linux-nodes consisting of four **t2.medium** EC2 instances. It sets up the necessary infrastructure to run Kubernetes workloads on AWS.

![image](https://github.com/user-attachments/assets/767594cc-5da5-4650-8317-e74ddf8a0017)

The cluster has been successfully created and is up and running! (Make sure to wait for atleast 5 minutes, cluster creation takes time depending upon the resources allocated).

Next, we want the kubectl to interact with cluster and for that execute the command:
```
aws eks update-kubeconfig --region us-east-1 --name ollama-cluster
```

To see the nodes running, execute the command:
```
kubectl get nodes
```

![image](https://github.com/user-attachments/assets/2d7e9102-6173-441f-8b90-05ada170a055)

Now, deploy the YAML manifests using these commands:
```
kubectl apply -f deployment.yml  #This command will deploy the number of replicas specified inside the deployment.yml onto the EC2 instances.

kubectl get all  #To view all the resources created
```

![image](https://github.com/user-attachments/assets/823484d5-183a-47a0-9a37-cfa5b54cd9b3)

The pods have been created along with the deployment and the replica set. In case the container doesn't come up, troubleshoot using the command:
```
kubectl logs <pod-id>
```

The logs from a container can provide insights into what is happening inside the container. Common Issues with Kubernetes Pods are listed below:

1. **CrashLoopBackOff**:
 - **Description**: A pod repeatedly crashes and restarts.
 - **Troubleshooting**:
 - Check pod logs: `kubectl logs <pod-id>`.
 - Describe the pod for more details: `kubectl describe pod <pod-name>`.
 - Investigate the application's start-up and initialization code.

2. **ImagePullBackOff**:
 - **Description**: Kubernetes cannot pull the container image from the registry.
 - **Troubleshooting**:
 - Verify the image name and tag.
 - Check the image registry credentials.
 - Ensure the image exists in the specified registry.

3. **Pending Pods**:
 - **Description**: Pods remain in the "Pending" state and are not scheduled.
 - **Troubleshooting**:
 - Check node resources (CPU, memory) to ensure there is enough capacity.
 - Ensure the nodes are labeled correctly if using node selectors or affinities.
 - Verify there are no taints on nodes that would prevent scheduling.

In case everything goes well, proceed with the deployment of the service of type Load Balancer. Command:
```
kubectl apply -f service.yml
```

![image](https://github.com/user-attachments/assets/a43b034d-121a-4beb-a9b3-11aa981187a3)

The highlighted text in the above picture is the endpoint URL that we have to hit using the curl command. This URL is Load Balancer's DNS Name. 

![image](https://github.com/user-attachments/assets/c300b514-90e2-4933-9995-9dcfd1103e0f)

Copy the DNS Name and paste it on the browser.

![image](https://github.com/user-attachments/assets/07432fd0-da39-4040-9fb3-28dad6c15753)

The above picture clearly demonstrates that the API server is up and running and ready to intercept requests. But make sure to send the POST request using the curl command at the **'/generate'** endpoint only. Command:
```
curl -X POST http://<Replace-with-Load-Balancer-DNS-Name>/generate -H "Content-Type: application/json" -d '{"prompt": "Who is Albert Einstein?"}'
```

![image](https://github.com/user-attachments/assets/26ee9839-2051-4cdf-a21f-21854708a232)

The curl command sent a POST request to the specified endpoint with the prompt "Who is Albert Einstein?" and received a JSON response explaining who Albert Einstein was, highlighting his contributions to physics and mathematics, particularly his theory of relativity.


## Task 3: Perform Load Testing using K6.io

For this task, we will be using K6.io, a powerful open-source load testing tool designed for modern infrastructure. It provides a modern scripting environment, using JavaScript, to create and execute test scripts that simulate a wide range of traffic conditions. K6 is known for its ease of use, high performance, and rich features, making it a popular choice for load testing APIs, websites, and other web services. It also offers seamless integration with CI/CD pipelines, enabling automated performance testing as part of the development workflow.

### Install K6 on your local system

The first step is to install K6 on your local system and for that refer: https://github.com/grafana/k6/releases. Download the latest zip archive.

### Extract K6

Extract the contents of the zip archive to a directory of your choice.

### Add K6 to Path

Add the directory containing k6.exe to your system's PATH environment variable.

### Verify Installation

Open a Command Prompt and run k6 version to ensure K6 is installed correctly.

![image](https://github.com/user-attachments/assets/f8d7cfed-b827-4422-a615-484a5252146f)

### Create a Test Script

The next step is to create a test script and we will be using Javascript for that. 

![image](https://github.com/user-attachments/assets/73b4e163-a0ac-46e3-93ed-25b0b559352e)

Make sure to replace the url with your Load Balancer's DNS Name along with the '/generate' endpoint. 
This K6 script orchestrates a load test using HTTP POST requests, sequentially ramping up users: starting with **5 users and increasing to 10 over 1 minute**, then maintaining **10 users for 2 minutes**, followed by scaling up to **15 users over 1 minute** and maintaining that for **2 minutes**. It concludes by **ramping down to 0 users over 1 minute**. The script monitors that no more than 10% of requests fail (http_req_failed) and that 95% of requests complete within 60 seconds (http_req_duration). It retries failed requests up to 3 times with a 90-second timeout, logs response times, and ensures each request achieves a 200 status code, ensuring thorough testing of the target endpoint's performance and reliability under simulated load conditions. This approach implements different test scenarios (e.g., gradual ramp-up, spike tests, endurance tests).

### Execute the script

Navigate to the directory containing your test script. Execute the following command:
```
k6 run load-test.js
```

![image](https://github.com/user-attachments/assets/7662362d-1872-419c-a00a-1f0c664864ed)


### Results: 

**1. Total Requests**: Simulated 82 HTTP requests across various scenarios.

**2. Success Rate**: 44 requests returned a successful status code (200), achieving a success rate of approximately **53.66%**.

**3. Variability in Response Time**: Average response time for successful requests ranged from 20000 ms to 50000 ms based on operation complexity.

**5. Load Testing**: Assessed system performance under varying virtual user loads, peaking at 20 virtual users.

❌ Unfortunately, only 44 out of 82 requests returned a successful status code (200), resulting in a success rate of approximately 53.66%.

✅ To increase the success rate of the requests, we'll be scaling up our infrastructure by upgrading the EC2 instance types from t2.medium to t2.xlarge. This change aims to improve performance and ensure smoother handling of the workload. 

**NOTE**: AWS only allows a cumulative capacity of 16 CPUs to spin up for the entire EC2 service for a personal account. Since t2.xlarge instance type is allocated 4 virtual CPUs, hence, we can spin up a maximum of 4 nodes. So, change the instance type to t2.xlarge now.

![image](https://github.com/user-attachments/assets/a12d1a14-4c64-4121-a56a-f9ae4b09f60a)

Deploy the pods again as well as the service.
```
kubectl apply -f deployment.yml
kubectl apply -f service.yml
kubectl get all
```

Perform the load test again:
```
k6 run load-test.js
```

### Results:

**1. Total Requests**: Simulated 120 HTTP requests across various scenarios.

**2. Success Rate**: 91 requests returned a successful status code (200), achieving a success rate of approximately **75.83%**.

**3. Variability in Response Times**: Average response time for successful requests ranged from 10000 ms to 40000 ms based on operation complexity.

**4. Load Testing**: Assessed system performance under varying virtual user loads, peaking at 20 virtual users.

**Inference**: Scaling the infrastructure from t2.medium to t2.xlarge significantly improved the system's ability to handle a higher volume of requests more efficiently. With the increased CPU and memory resources provided by the t2.xlarge instance, the server managed to process a larger number of concurrent requests successfully **(from 53.66% to 75.83%)**, reducing the likelihood of bottlenecks. This upgrade not only increased throughput but also resulted in a noticeable decrease in response times **(from 20,000ms-50,000ms to 10,000ms-40,000ms)**, ensuring faster and more reliable service for end-users. The enhanced capacity of the t2.xlarge instance allowed the application to maintain performance under load, demonstrating the critical role of appropriate infrastructure scaling in optimizing application responsiveness and user experience.


## Task 4: Implement HPA for Deployment to Scale based upon CPU Utilization

Implementing Horizontal Pod Autoscaler (HPA) for the deployment is a strategic approach to dynamically scale application pods based on CPU and memory usage, as well as custom metrics. By monitoring key performance indicators like CPU utilization, HPA ensures that the number of running pods adjusts automatically to meet the current demand. When CPU or memory usage exceeds predefined thresholds, HPA increases the number of pods to handle the load, thereby maintaining optimal performance and avoiding potential downtime. Conversely, during periods of low utilization, HPA scales down the number of pods to conserve resources and reduce costs. This automated scaling mechanism not only enhances the application's resilience and responsiveness but also optimizes resource utilization, ensuring efficient and cost-effective operations.

Create hpa.yml specifying the Deployment name along with minimum and maximum replicas of pods.

![image](https://github.com/user-attachments/assets/c282412b-2226-4839-a912-771a91c27901)

The provided code defines a Horizontal Pod Autoscaler (HPA) for a Kubernetes deployment named ollama-app. This HPA automatically adjusts the number of pod replicas within the specified range of 4 to 10, based on the resource usage metrics. Specifically, it monitors CPU utilization, aiming to maintain an average CPU usage of 100 millicores (100m) per pod. When the CPU usage exceeds this target, the HPA increases the number of replicas to handle the load; conversely, it decreases the number of replicas when the CPU usage is below the target, ensuring efficient resource utilization and maintaining optimal performance of the ollama-app deployment.

Before executing the YAML manifest, you need to install the Kubernetes Metrics Server , which provides the resource usage metrics necessary for monitoring the pods consumption:
```
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Verify the installation:
```
kubectl get pods -n kube-system | grep metrics-server
```

You should see a metrics-server pod running.

Now, apply the HorizontalPodAutoscaler YAML manifest using this command:
```
kubectl apply -f hpa.yml
```

Verify the HPA:
```
kubectl get hpa
```

This command will show you the current status of the HPA, including the current number of replicas and target metrics.

Execute this command:
```
kubectl top pods
```

The command 'kubectl top pods' is used to display resource usage (CPU and memory) of the pods in a Kubernetes cluster. This command helps you monitor and understand the resource consumption of your pods, which is essential for performance tuning and resource management. It provides real-time metrics, allowing you to see how much CPU and memory each pod is using.

![image](https://github.com/user-attachments/assets/0ac5b771-0df3-4191-a239-4a5b06009040)

As we have not executed the load testing script yet, we can see the number of pods (4) as per the deployment along with their CPU consumption.


## Task 5: Advanced Load Testing Monitoring System Auto Scaling

Execute the load testing script.
```
k6 run load-test.js
```

After executing the script, monitor the pods using the command **'kubectl top pods'**.

![image](https://github.com/user-attachments/assets/81358d21-785f-4305-89a8-6f7cbf1bf9e5)

The above image demonstrates that as soon as the load increased and surpassed the threshold limit of 100m, 6 more pods came up to handle the load and distribute it evenly.

### Results:

**1. Total Requests**: Simulated 131 HTTP requests across various scenarios.

**2. Success Rate**: 112 requests returned a successful status code (200), achieving a success rate of approximately **85.49%**.

**3. Variability in Response Times**: Average response time for successful requests ranged from 5000 ms to 20000 ms based on operation complexity.

**4. Load Testing**: Assessed system performance under varying virtual user loads, peaking at 20 virtual users.


## Task 6: GitHub Actions CI/CD Pipeline

Creating a GitHub Actions CI/CD pipeline for this project involves automating the build, test, and deployment processes directly from the GitHub repository. By leveraging GitHub Actions, we will create workflows that automatically trigger code changes, ensuring your application is always up-to-date and tested before deployment. 

The workflow is triggered by pushes and pull requests to the "Main" branch. The job runs on the latest Ubuntu environment and consists of several steps. First, it checks out the code from the repository. Next, it sets up Docker Buildx, logs into DockerHub using stored secrets, and builds and pushes a Docker image to DockerHub. It then installs kubectl for Kubernetes management and configures AWS CLI with the necessary credentials to interact with AWS services. The kubeconfig is updated to connect to the specified EKS cluster. Finally, the workflow deploys the application to the EKS cluster by applying the Kubernetes deployment, service, and HPA configuration files. This streamlined process ensures the application is continuously integrated and deployed, facilitating efficient and reliable updates.

Storing the secrets here:
```
Navigate to Settings -> Secrets -> New repository secret.

# Add these secrets

- AWS_ACCESS_KEY_ID
- AWS_REGION
- AWS_SECRET_ACCESS_KEY
- DOCKER_PASSWORD
- DOCKER_USERNAME
- EKS_CLUSTER_NAME
```

![image](https://github.com/user-attachments/assets/ea7e53dc-ede4-4270-abdd-0aadd71d3ec7)

To test the GitHub Actions CI/CD Pipeline, append a comment to any of the files and commit it to the repository. 

![image](https://github.com/user-attachments/assets/2ed72c14-0843-4c58-ba38-466de82004ae)

The pipeline is executed successfully and an updated Docker image is also uploaded to the Docker Hub account.

![image](https://github.com/user-attachments/assets/8c48737c-5d8c-4881-a618-4807da283a02)


## Task 7: Comparing performance across different LLMs within Ollama

The file models-comparison.pdf extensively covers the performance of models across different LLM's within Ollama.


## Best Practices Learned 

**1. Regular Performance Testing:** Regular Performance Testing of the application with different infrastructure levels gives a clear understanding of the application performance and user experience. Reviewing and optimizing the infrastructure based on performance test results ensured robustness and readiness for anticipated operational conditions.

**2. Containerization:** Using Docker to containerize applications ensures consistency across different environments and simplifies deployment.

**3. Infrastructure as Code (IaC):** Automating the creation of cloud infrastructure using tools like 'eksctl' ensures the reproducibility and scalability of the deployment process.

**4. Load Balancing:** Implementing a load balancer distributes traffic across multiple instances, enhancing the availability and reliability of the application.

**5. Use GitHub Actions for CI/CD:** Automating the build, test, and deployment process using GitHub Actions helps maintain consistency and efficiency.

**6. Securely Manage Secrets:** Use GitHub Secrets to store sensitive information such as DockerHub credentials and AWS keys.

**7. Scalability:** Implement HPA to automatically scale your application based on CPU utilization, ensuring optimal performance and resource utilization.





























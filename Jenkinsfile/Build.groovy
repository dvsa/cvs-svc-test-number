def label = "jenkins-node-${UUID.randomUUID().toString()}"
podTemplate(label: label, containers: [
        containerTemplate(name: 'dynamodb',
                image: 'amazon/dynamodb-local',
                command: 'java -jar /home/dynamodblocal/DynamoDBLocal.jar -inMemory -sharedDb -port 8005',
                ports: [portMapping(name: 'dynamoport', containerPort: 8005, hostPort: 8005)]),
        containerTemplate(name: 'node', image: '086658912680.dkr.ecr.eu-west-1.amazonaws.com/cvs/nodejs-builder:latest', ttyEnabled: true, alwaysPullImage: true, command: 'cat'),]){
    node(label) {

        stage('checkout') {
            checkout scm
        }

        container('node'){

            withFolderProperties{
                LBRANCH="${env.BRANCH}".toLowerCase()
            }

            stage ("npm deps") {
                sh "npm install"
            }

            stage ("security") {
                sh "git secrets --register-aws"
                sh "git secrets --scan"
                sh "git log -p | scanrepo"
            }

            stage ("credentials") {
                withCredentials([usernamePassword(credentialsId: 'dummy-credentials', passwordVariable: 'SECRET', usernameVariable: 'KEY')]) {
                    sh "sls config credentials --provider aws --key ${KEY} --secret ${SECRET}"
                }
            }
            stage ("create-seed-table") {

                sh '''
                aws dynamodb create-table \
                --region=eu-west-1 \
                --endpoint-url http://localhost:8005 \
                --table-name cvs-local-activities \
                --attribute-definitions AttributeName=id,AttributeType=S AttributeName=testerStaffId,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --global-secondary-indexes IndexName=StaffIndex,KeySchema=[{AttributeName=testerStaffId,KeyType=HASH}],Projection={ProjectionType=INCLUDE,NonKeyAttributes=[activityType,testStationName,testStationNumber,testStationEmail,testStationType,testerName,startTime,endTime]},ProvisionedThroughput="{ReadCapacityUnits=1,WriteCapacityUnits=1}"
                '''

                sh "sls dynamodb seed --seed=activities"
            }

            stage ("lint") {
                sh "npm run lint"
            }

            stage ("sonar") {
                sh "npm run sonar-scanner"
            }

            stage ("build") {
                sh "npm run build"
            }

            stage ("unit test") {
                sh "BRANCH=local npm run test"
            }

            stage ("integration test") {
                sh "BRANCH=local node_modules/gulp/bin/gulp.js start-serverless"
                sh "BRANCH=local npm run test-i"
            }

            stage("zip dir"){
                sh "mkdir ${LBRANCH}" // Create the package folder
                sh "cp package.json package-lock.json ${LBRANCH}"
                sh "cd .build/src && cp -r . ../../${LBRANCH}"
                sh "cd ${LBRANCH} && npm install --production"
                sh "rm ${LBRANCH}/package.json ${LBRANCH}/package-lock.json"
                sh "cd ${LBRANCH} && zip -qr ../${LBRANCH}.zip ."
            }

            stage("upload to s3") {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                  credentialsId: 'jenkins-iam',
                                  secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {

                    sh "aws s3 cp ${LBRANCH}.zip s3://cvs-services/activities/${LBRANCH}.zip"
                }
            }
        }
    }
}

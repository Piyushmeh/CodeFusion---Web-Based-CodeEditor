FROM node:20

RUN apt-get update && \
    apt-get install -y default-jdk python3 g++ gcc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


RUN mkdir -p /usr/include/bits && \
    echo '#include <iostream>' > /usr/include/bits/stdc++.h && \
    echo '#include <string>' >> /usr/include/bits/stdc++.h && \
    echo '#include <vector>' >> /usr/include/bits/stdc++.h && \
    echo '#include <algorithm>' >> /usr/include/bits/stdc++.h && \
    echo '#include <map>' >> /usr/include/bits/stdc++.h && \
    echo '#include <set>' >> /usr/include/bits/stdc++.h && \
    echo '#include <queue>' >> /usr/include/bits/stdc++.h && \
    echo '#include <stack>' >> /usr/include/bits/stdc++.h && \
    echo '#include <cmath>' >> /usr/include/bits/stdc++.h && \
    echo '#include <cstring>' >> /usr/include/bits/stdc++.h && \
    echo '#include <sstream>' >> /usr/include/bits/stdc++.h && \
    echo '#include <numeric>' >> /usr/include/bits/stdc++.h && \
    echo '#include <climits>' >> /usr/include/bits/stdc++.h && \
    echo '#include <unordered_map>' >> /usr/include/bits/stdc++.h && \
    echo '#include <unordered_set>' >> /usr/include/bits/stdc++.h && \
    echo '#include <functional>' >> /usr/include/bits/stdc++.h && \
    echo '#include <utility>' >> /usr/include/bits/stdc++.h && \
    echo '#include <iomanip>' >> /usr/include/bits/stdc++.h && \
    echo '#include <stdexcept>' >> /usr/include/bits/stdc++.h


ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH="${JAVA_HOME}/bin:/usr/bin:${PATH}"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5000
CMD ["npm", "start"]